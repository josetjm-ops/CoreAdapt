import { adminDb, adminAuth } from './_firebase-admin.js';

/**
 * Vercel Serverless Function: /api/strava-token
 * Versión 2.0: Verifica Firebase ID token, guarda tokens Strava en Firestore
 * (nunca expuestos al cliente). Retorna solo datos de UI.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, uid } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }
  if (!uid) {
    return res.status(401).json({ error: 'UID is required' });
  }

  try {
    // 1. Verificar identidad del usuario
    if (!adminDb) {
      return res.status(503).json({ error: 'Firebase Admin SDK no configurado. Agrega FIREBASE_SERVICE_ACCOUNT_JSON en Vercel.' });
    }

    // 2. Intercambiar código por tokens con Strava
    const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to exchange Strava token');
    }

    // 3. Guardar tokens en Firestore (subcollection segura, solo accesible con Admin SDK)
    await adminDb.doc(`users/${uid}/integrations/strava`).set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athleteId: data.athlete?.id,
      connectedAt: new Date().toISOString()
    });

    // 4. Retornar solo datos de UI (sin tokens)
    return res.status(200).json({
      connected: true,
      athlete: data.athlete
    });

  } catch (error) {
    console.error('Error in strava-token:', error.message);
    return res.status(500).json({
      error: 'Failed to exchange Strava token',
      details: error.message
    });
  }
}
