/**
 * GarminDataNormalizer.js
 * Normalizes raw Garmin Connect data and calculates HRV trends.
 */

export const normalizeGarminData = (rawData, hrvHistory = []) => {
  const { hrv, bodyBattery, restingHR } = rawData;
  
  // Calculate 7-day HRV Average
  const hrvValues = hrvHistory.map(log => log.hrv || 0).filter(v => v > 0);
  const avgHRV = hrvValues.length > 0 
    ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length 
    : hrv;

  // Rule: Alerta Sobreentreno if HRV is 15% below average
  const threshold = avgHRV * 0.85;
  const alertaSobreentreno = hrv < threshold;

  return {
    hrv,
    avgHRV: Math.round(avgHRV),
    body_battery: bodyBattery,
    fc_reposo: restingHR,
    alerta_sobreentreno: alertaSobreentreno,
    trend: hrv > avgHRV ? 'positive' : 'negative'
  };
};

export const mapStravaActivity = (stravaData, currentPlan = []) => {
  const { distance, totalElevationGain, movingTime, type, startDate } = stravaData;
  
  // Logical link with plan
  const matchedSession = currentPlan.find(session => 
    session.discipline.toLowerCase() === type.toLowerCase() &&
    !session.done
  );

  return {
    isExtraActivity: !matchedSession,
    activityData: {
      distance: (distance / 1000).toFixed(2), // meters to km
      elevation: totalElevationGain,
      duration: (movingTime / 60).toFixed(0), // seconds to minutes
      type,
      startDate,
      specialist: type.includes('Trail') ? 'Trail Specialist' : 
                  (type.includes('Ride') || type.includes('Cycling')) ? 'Cycling/MTB Strategist' : 
                  'Running Pro'
    },
    recommendationMsg: !matchedSession ? "Actividad Extra Detectada: El Cerebro analizará el impacto en la carga total." : null
  };
};
