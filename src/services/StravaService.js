import { connectionService } from './ConnectionService';
import { TokenVault } from './TokenVault';

export const StravaService = {
  async getRecentActivities(before, after) {
    const status = connectionService.getStatus('strava');
    if (!status?.connected) throw new Error('Strava not connected');

    const accessToken = await TokenVault.getValidStravaAccessToken();

    const params = new URLSearchParams({ per_page: '10' });
    if (before) params.set('before', before);
    if (after) params.set('after', after);

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error('Failed to fetch Strava activities');
    return await response.json();
  },

  normalizeActivity(activity) {
    return {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      distance: (activity.distance / 1000).toFixed(2),
      movingTime: Math.round(activity.moving_time / 60),
      elapsedTime: Math.round(activity.elapsed_time / 60),
      startDate: activity.start_date,
      averageHeartRate: activity.has_heartrate ? activity.average_heartrate : null,
      maxHeartRate: activity.has_heartrate ? activity.max_heartrate : null,
      calories: activity.calories || 0,
      rpe: null,
      source: 'strava'
    };
  },

  async getWeeklySummary() {
    try {
      const after = Math.floor((Date.now() - 7 * 86400000) / 1000);
      const activities = await this.getRecentActivities(undefined, after);
      const normalized = activities.map(a => this.normalizeActivity(a));

      const totalKm = normalized.reduce((s, a) => s + parseFloat(a.distance || 0), 0);
      const totalMin = normalized.reduce((s, a) => s + (a.movingTime || 0), 0);
      const disciplinas = [...new Set(normalized.map(a => a.type))];

      if (normalized.length === 0) return 'Sin actividades registradas en Strava esta semana.';

      return `Strava: ${normalized.length} actividades esta semana — ${totalKm.toFixed(1)} km totales, ${Math.round(totalMin / 60)}h ${totalMin % 60}min. Disciplinas: ${disciplinas.join(', ')}.`;
    } catch {
      return 'Resumen Strava no disponible.';
    }
  }
};
