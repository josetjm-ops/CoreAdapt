import { connectionService } from './ConnectionService';

export const StravaService = {
  /**
   * Obtiene las actividades recientes del atleta desde Strava
   */
  async getRecentActivities(before, after) {
    const status = connectionService.getStatus('strava');
    if (!status || !status.connected || !status.accessToken) {
      throw new Error('Strava not connected');
    }

    try {
      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?before=${before || ''}&after=${after || ''}&per_page=10`, {
        headers: {
          'Authorization': `Bearer ${status.accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, need to refresh (implement later)
          console.warn('Strava access token expired');
        }
        throw new Error('Failed to fetch Strava activities');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Strava activities:', error);
      throw error;
    }
  },

  /**
   * Normaliza los datos de Strava al formato de CoreAdapt
   */
  normalizeActivity(activity) {
    return {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      distance: (activity.distance / 1000).toFixed(2), // km
      movingTime: Math.round(activity.moving_time / 60), // minutes
      elapsedTime: Math.round(activity.elapsed_time / 60),
      startDate: activity.start_date,
      averageHeartRate: activity.has_heartrate ? activity.average_heartrate : null,
      maxHeartRate: activity.has_heartrate ? activity.max_heartrate : null,
      calories: activity.calories || 0,
      rpe: null, // Feedback required from user
      source: 'strava'
    };
  }
};
