import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getPersonalUID } from './PersonalUser';

/**
 * TokenVault — Lee tokens de Strava desde Firestore (client SDK).
 * Los tokens nunca pasan por localStorage. El refresh se delega al serverless
 * /api/strava-refresh que usa Admin SDK y nunca expone el refreshToken al cliente.
 *
 * Usa PersonalUser UID en vez de Firebase Auth.
 */
export const TokenVault = {
  async getStravaTokens() {
    const uid = getPersonalUID();

    const snap = await getDoc(doc(db, 'users', uid, 'integrations', 'strava'));
    if (!snap.exists()) throw new Error('Strava not connected');
    return snap.data(); // { accessToken, refreshToken, expiresAt, athleteId }
  },

  async getValidStravaAccessToken() {
    const uid = getPersonalUID();
    const tokens = await this.getStravaTokens();

    // El token expira en el futuro con al menos 1 hora de margen → reutilizar
    if (tokens.expiresAt && Date.now() / 1000 < tokens.expiresAt - 3600) {
      return tokens.accessToken;
    }

    // Token expirado o próximo a expirar → refrescar via serverless
    const refreshRes = await fetch('/api/strava-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid })
    });

    if (!refreshRes.ok) throw new Error('Failed to refresh Strava token');
    const { accessToken } = await refreshRes.json();
    return accessToken;
  }
};
