import { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { sortByTimestamp } from '../utils/helpers';

/**
 * useMiPlan — carga el plan más reciente desde MiPlan_Ajustes.
 *
 * Retorna además planTimestamp (para que useCompliance calcule
 * qué días del plan han transcurrido) y macrophase (la fase del
 * macrociclo que el Brain calculó al generar el plan).
 */
const useMiPlan = () => {
  const [brainPlan, setBrainPlan] = useState(null);
  const [planTimestamp, setPlanTimestamp] = useState(null);
  const [macrophase, setMacrophase] = useState(null);
  const [diaActual, setDiaActual] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }

      try {
        const q = query(
          collection(db, 'MiPlan_Ajustes'),
          where('userId', '==', user.uid),
          orderBy('timestamp_generacion', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const latestDoc = snapshot.docs[0].data();
          const plan = latestDoc.plan_generado;

          setBrainPlan(plan);
          setMacrophase(plan?.macrophase || null);

          const ts = latestDoc.timestamp_generacion?.toMillis?.() || null;
          setPlanTimestamp(ts);

          if (ts) {
            const diasDesde = Math.floor((Date.now() - ts) / 86400000);
            setDiaActual(Math.min(Math.max(diasDesde, 0), 6));
          }
        }
      } catch (err) {
        console.error('[useMiPlan] error:', err);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { brainPlan, setBrainPlan, planTimestamp, macrophase, diaActual, loading };
};

export default useMiPlan;
