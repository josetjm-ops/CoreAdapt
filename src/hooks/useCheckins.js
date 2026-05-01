import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { calculateACWR, getACWRStatus, detectHRVDowntrend } from '../utils/acwr';

/**
 * useCheckins — datos biométricos en tiempo real del atleta.
 *
 * Fetch de 28 días (en vez de 7) para calcular:
 *   - ACWR (Acute:Chronic Workload Ratio)
 *   - Tendencia sostenida de HRV (detección de sobreentrenamiento)
 *   - Promedio 7d HRV y Battery
 *
 * Retorna:
 *   todayCheckin       — check-in del día actual
 *   last7Checkins      — últimos 7 días
 *   last28Checkins     — últimos 28 días (para ACWR)
 *   avgHRV7d           — promedio HRV 7 días
 *   avgBattery7d       — promedio Battery 7 días
 *   acwr               — ratio carga aguda/crónica (null si < 7 check-ins)
 *   acwrStatus         — { zone, label, color, action }
 *   sobreentrenamiento — true si caída HRV > 20% sostenida 7 días
 *   hrvDowntrend       — { sobreentrenamiento, caida_pct }
 *   loading
 */
const useCheckins = () => {
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [last7Checkins, setLast7Checkins] = useState([]);
  const [last28Checkins, setLast28Checkins] = useState([]);
  const [avgHRV7d, setAvgHRV7d] = useState(null);
  const [avgBattery7d, setAvgBattery7d] = useState(null);
  const [acwr, setAcwr] = useState(null);
  const [acwrStatus, setAcwrStatus] = useState(null);
  const [hrvDowntrend, setHrvDowntrend] = useState({ sobreentrenamiento: false, caida_pct: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubQuery = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubQuery) { unsubQuery(); unsubQuery = null; }

      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // Extender a 28 días para ACWR
      const since28 = new Date();
      since28.setDate(since28.getDate() - 28);
      const since28Str = since28.toISOString().split('T')[0];

      const q = query(
        collection(db, 'Checkins'),
        where('userId', '==', user.uid),
        where('fecha', '>=', since28Str),
        orderBy('fecha', 'desc'),
        limit(28)
      );

      unsubQuery = onSnapshot(q, (snap) => {
        const all28 = snap.docs.map((d) => d.data());
        const all7 = all28.slice(0, 7);

        setLast28Checkins(all28);
        setLast7Checkins(all7);
        setTodayCheckin(all28.find((c) => c.fecha === today) || null);

        // Promedios 7 días
        const withHRV7 = all7.filter((c) => c.hrv_manual > 0);
        const withBat7 = all7.filter((c) => c.body_battery > 0);

        setAvgHRV7d(withHRV7.length > 0
          ? Math.round(withHRV7.reduce((s, c) => s + c.hrv_manual, 0) / withHRV7.length)
          : null);
        setAvgBattery7d(withBat7.length > 0
          ? Math.round(withBat7.reduce((s, c) => s + c.body_battery, 0) / withBat7.length)
          : null);

        // ACWR
        const acwrValue = calculateACWR(all28);
        setAcwr(acwrValue);
        setAcwrStatus(getACWRStatus(acwrValue));

        // HRV sustained downtrend → diagnóstico de sobreentrenamiento
        const downtrend = detectHRVDowntrend(all28);
        setHrvDowntrend(downtrend);

        setLoading(false);
      }, (err) => {
        console.error('[useCheckins] error:', err);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubQuery) unsubQuery();
    };
  }, []);

  return {
    todayCheckin,
    last7Checkins,
    last28Checkins,
    avgHRV7d,
    avgBattery7d,
    acwr,
    acwrStatus,
    sobreentrenamiento: hrvDowntrend.sobreentrenamiento,
    hrvDowntrend,
    loading,
  };
};

export default useCheckins;
