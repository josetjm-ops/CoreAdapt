/**
 * acwr.js — ACWR (Acute:Chronic Workload Ratio) Calculator
 *
 * ACWR = Carga Aguda (7 días) / Carga Crónica (28 días)
 * Zona óptima: 0.8 – 1.3
 * Zona de peligro: > 1.5  → activa ruteo al Agente de Fisiología
 *
 * Load proxy usado: RPE × sesion_completada
 * (RPE 1-10 escala, 0 si sesión no completada o día de descanso)
 */

/**
 * @param {Array<{ rpe_sesion: number, sesion_completada: boolean }>} checkins
 *   Ordenados del más reciente (índice 0) al más antiguo (índice N)
 * @returns {number|null}  ACWR redondeado a 2 decimales, null si datos insuficientes
 */
export function calculateACWR(checkins) {
  if (!checkins || checkins.length < 7) return null;

  const loads = checkins.map((c) =>
    c.sesion_completada && c.rpe_sesion > 0 ? c.rpe_sesion : 0
  );

  const acute7 = loads.slice(0, 7);
  const chronic28 = loads.slice(0, 28);

  const acuteAvg = acute7.reduce((a, b) => a + b, 0) / 7;
  // Denominator is always 28 to avoid inflating ACWR when fewer than 28 days exist
  const chronicAvg = chronic28.reduce((a, b) => a + b, 0) / 28;

  if (chronicAvg === 0) return null;
  return parseFloat((acuteAvg / chronicAvg).toFixed(2));
}

/**
 * @param {number|null} acwr
 * @returns {{ zone: string, label: string, color: string, action: string }}
 */
export function getACWRStatus(acwr) {
  if (acwr === null) {
    return {
      zone: 'unknown',
      label: 'Sin datos',
      color: 'var(--on-surface-variant)',
      action: 'Acumula más check-ins para calcular el ratio de carga.',
    };
  }
  if (acwr < 0.8) {
    return {
      zone: 'undertrained',
      label: `ACWR ${acwr} — Subcarga`,
      color: '#FFA726',
      action: 'Volumen inferior al crónico. Considera aumentar carga gradualmente.',
    };
  }
  if (acwr <= 1.3) {
    return {
      zone: 'optimal',
      label: `ACWR ${acwr} — Óptimo`,
      color: 'var(--primary)',
      action: 'Zona de progresión segura. Mantén la carga actual.',
    };
  }
  if (acwr <= 1.5) {
    return {
      zone: 'warning',
      label: `ACWR ${acwr} — Precaución`,
      color: '#FF7043',
      action: 'Carga elevada. Prioriza recuperación y modera la intensidad.',
    };
  }
  return {
    zone: 'danger',
    label: `ACWR ${acwr} — Zona de Peligro`,
    color: '#F44336',
    action: '⚠️ Riesgo de lesión. El Agente de Fisiología tomará control del plan.',
  };
}

/**
 * Detecta tendencia sostenida de descenso del HRV durante 7 días.
 * @param {Array<{ hrv_manual: number }>} checkins  Últimos 14 días ordenados desc
 * @returns {{ sobreentrenamiento: boolean, caida_pct: number|null }}
 */
export function detectHRVDowntrend(checkins) {
  const withHRV = checkins.filter((c) => c.hrv_manual > 0);
  if (withHRV.length < 10) return { sobreentrenamiento: false, caida_pct: null };

  const recientes = withHRV.slice(0, 7);
  const anteriores = withHRV.slice(7, 14);

  if (recientes.length < 4 || anteriores.length < 3) return { sobreentrenamiento: false, caida_pct: null };

  const avgReciente = recientes.reduce((a, c) => a + c.hrv_manual, 0) / recientes.length;
  const avgAnterior = anteriores.reduce((a, c) => a + c.hrv_manual, 0) / anteriores.length;

  const caida_pct = parseFloat((((avgAnterior - avgReciente) / avgAnterior) * 100).toFixed(1));
  return {
    sobreentrenamiento: caida_pct > 20,
    caida_pct,
  };
}
