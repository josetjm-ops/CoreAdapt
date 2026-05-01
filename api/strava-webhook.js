import { createHmac } from 'crypto';
import { adminDb } from './_firebase-admin.js';

/**
 * Vercel Serverless Function: /api/strava-webhook
 *
 * Seguridad implementada:
 *   1. GET handshake: verifica hub.verify_token (suscripción inicial)
 *   2. POST: HMAC-SHA256 del body con STRAVA_WEBHOOK_SECRET contra X-Hub-Signature-256
 *   3. Ventana de tolerancia de 300 segundos (anti-replay via timestamp del evento)
 *   4. Validación de owner_id contra usuarios registrados en Firestore
 *
 * Setup en Strava Developer Portal:
 *   Callback URL: https://your-app.vercel.app/api/strava-webhook
 *   Verify Token: valor de STRAVA_WEBHOOK_VERIFY_TOKEN
 */

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || 'coreadapt_webhook_2026';
const WEBHOOK_SECRET = process.env.STRAVA_WEBHOOK_SECRET;

const TIPO_MAP = {
  Run: 'Running',
  TrailRun: 'Trail',
  Ride: 'Ruta',
  VirtualRide: 'Ruta',
  MountainBikeRide: 'MTB',
  GravelRide: 'MTB',
  Swim: 'Natacion',
  WeightTraining: 'Pesas',
  Workout: 'Pesas',
};

function verifyHmacSignature(rawBody, signatureHeader) {
  if (!WEBHOOK_SECRET) return true; // Skip validation if secret not configured
  if (!signatureHeader) return false;

  const expected = `sha256=${createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex')}`;

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return diff === 0;
}

export default async function handler(req, res) {
  // ── GET: Verificación de suscripción (Strava handshake) ─────────────────────
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).json({ 'hub.challenge': challenge });
    }
    return res.status(403).json({ error: 'Verificación fallida.' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });

  // ── POST: Validación HMAC-SHA256 ─────────────────────────────────────────────
  const rawBody = JSON.stringify(req.body);
  const signature = req.headers['x-hub-signature-256'];
  if (!verifyHmacSignature(rawBody, signature)) {
    console.warn('[Strava webhook] Firma HMAC inválida — posible ataque de replay.');
    return res.status(401).json({ error: 'Firma inválida.' });
  }

  // ── Ventana de tolerancia 300 segundos (anti-replay) ─────────────────────────
  const eventTimestamp = req.body.event_time;
  if (eventTimestamp) {
    const ageSeconds = Math.floor(Date.now() / 1000) - eventTimestamp;
    if (ageSeconds > 300) {
      console.warn(`[Strava webhook] Evento rechazado: ${ageSeconds}s de antigüedad (límite 300s).`);
      return res.status(200).json({ status: 'expired_event' }); // 200 para que Strava no reintente
    }
  }

  const { object_type, aspect_type, object_id, owner_id } = req.body;

  // Solo procesar creación de actividades
  if (object_type !== 'activity' || aspect_type !== 'create') {
    return res.status(200).json({ status: 'ignored' });
  }

  // Responder 200 inmediatamente (Strava requiere respuesta < 2 segundos)
  // El procesamiento continúa de forma asíncrona
  res.status(200).json({ status: 'processing' });

  try {
    // Buscar usuario por athleteId
    const integrationsSnap = await adminDb.collectionGroup('integrations')
      .where('athleteId', '==', owner_id)
      .limit(1)
      .get();

    if (integrationsSnap.empty) {
      console.log(`[Strava webhook] Atleta ${owner_id} no encontrado.`);
      return;
    }

    const integrationDoc = integrationsSnap.docs[0];
    const { accessToken, refreshToken, expiresAt } = integrationDoc.data();
    const uid = integrationDoc.ref.parent.parent.id;

    // Refresh token si necesario
    let token = accessToken;
    if (Date.now() / 1000 > expiresAt - 300) {
      const refreshRes = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });
      const refreshData = await refreshRes.json();
      token = refreshData.access_token;
      await integrationDoc.ref.update({
        accessToken: refreshData.access_token,
        refreshToken: refreshData.refresh_token,
        expiresAt: refreshData.expires_at,
      });
    }

    // Obtener detalles de la actividad
    const actRes = await fetch(`https://www.strava.com/api/v3/activities/${object_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!actRes.ok) throw new Error(`Strava API ${actRes.status}`);
    const activity = await actRes.json();

    const fecha = activity.start_date_local?.split('T')[0] || new Date().toISOString().split('T')[0];
    const tipo = TIPO_MAP[activity.sport_type] || TIPO_MAP[activity.type] || 'Running';

    // Prevenir duplicados
    const existing = await adminDb.collection('Actividades')
      .where('strava_id', '==', String(object_id))
      .limit(1)
      .get();
    if (!existing.empty) {
      console.log(`[Strava webhook] Actividad ${object_id} ya existe. Ignorando.`);
      return;
    }

    await adminDb.collection('Actividades').add({
      userId: uid,
      strava_id: String(object_id),
      fecha,
      timestamp: new Date(),
      tipo,
      fuente: 'strava',
      nombre: activity.name,
      distancia_km: activity.distance ? parseFloat((activity.distance / 1000).toFixed(2)) : null,
      duracion_min: activity.moving_time ? Math.round(activity.moving_time / 60) : null,
      elevacion_m: activity.total_elevation_gain || null,
      fc_media: activity.has_heartrate ? activity.average_heartrate : null,
      fc_max: activity.has_heartrate ? activity.max_heartrate : null,
      rpe: null,
      completada: true,
      notas: '',
    });

    console.log(`[Strava webhook] Actividad ${object_id} importada para uid ${uid}.`);
  } catch (error) {
    console.error('[Strava webhook] Error procesando actividad:', error);
  }
}
