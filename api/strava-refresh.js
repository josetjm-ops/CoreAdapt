import { adminDb, adminAuth } from './_firebase-admin.js';

/**
 * Vercel Serverless Function: /api/strava-refresh
 * Lee el refreshToken desde Firestore (Admin SDK), renueva el accessToken
 * con Strava y lo actualiza en Firestore. Retorna el nuevo accessToken.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid } = req.body;
  if (!uid) {
    return res.status(401).json({ error: 'UID is required' });
  }

  try {
    // 1. Verificar identidad del usuario
    if (!adminDb) {
      return res.status(503).json({ error: 'Firebase Admin SDK no configurado. Agrega FIREBASE_SERVICE_ACCOUNT_JSON en Vercel.' });
    }

    // 2. Leer refreshToken desde Firestore
    const snap = await adminDb.doc(`users/${uid}/integrations/strava`).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Strava not connected for this user' });
    }
    const { refreshToken } = snap.data();

    // 3. Solicitar nuevo token a Strava
    const refreshRes = await fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    const refreshData = await refreshRes.json();
    if (!refreshRes.ok) {
      throw new Error(refreshData.message || 'Strava refresh failed');
    }

    // 4. Actualizar tokens en Firestore
    await adminDb.doc(`users/${uid}/integrations/strava`).update({
      accessToken: refreshData.access_token,
      refreshToken: refreshData.refresh_token,
      expiresAt: refreshData.expires_at
    });

    // 5. Retornar solo el nuevo accessToken (ephemeral, para uso inmediato)
    return res.status(200).json({
      accessToken: refreshData.access_token,
      expiresAt: refreshData.expires_at
    });

  } catch (error) {
    console.error('Error in strava-refresh:', error.message);
    return res.status(500).json({ error: 'Failed to refresh Strava token', details: error.message });
  }
}
