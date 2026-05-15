/**
 * useCompliance — Algoritmo de Incumplimiento y Reprogramación Dinámica
 *
 * Usa PersonalUser UID en vez de Firebase Auth.
 * Lee el plan más reciente de MiPlan_Ajustes y los check-ins correspondientes
 * para calcular la tasa de cumplimiento.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getPersonalUID } from '../services/PersonalUser';

const useCompliance = () => {
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubCheckins = null;
    const uid = getPersonalUID();

    const init = async () => {
      try {
        // Cargar plan más reciente
        const planSnap = await getDocs(
          query(
            collection(db, 'MiPlan_Ajustes'),
            where('userId', '==', uid),
            orderBy('timestamp_generacion', 'desc'),
            limit(1)
          )
        );

        if (planSnap.empty) {
          setCompliance(null);
          setLoading(false);
          return;
        }

        const planDoc = planSnap.docs[0].data();
        const microciclo = planDoc.plan_generado?.microciclo || [];
        const planTimestamp = planDoc.timestamp_generacion?.toMillis?.() || Date.now();
        const planStartDate = new Date(planTimestamp);

        // Construir rango de fechas del plan (7 días desde generación)
        const planDates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(planStartDate);
          d.setDate(d.getDate() + i);
          return d.toISOString().split('T')[0];
        });

        const today = new Date().toISOString().split('T')[0];
        const diasTranscurridos = planDates.filter((d) => d <= today).length;

        if (diasTranscurridos === 0) {
          setCompliance({ action: 'continue', diasPerdidos: 0, cumplimiento: 1, sesionesEsperadas: 0, sesionesCompletadas: 0 });
          setLoading(false);
          return;
        }

        // Escuchar check-ins del período del plan en tiempo real
        const since = planDates[0];
        const until = today;

        unsubCheckins = onSnapshot(
          query(
            collection(db, 'Checkins'),
            where('userId', '==', uid),
            where('fecha', '>=', since),
            where('fecha', '<=', until),
            orderBy('fecha', 'desc')
          ),
          (snap) => {
            const checkins = snap.docs.map((d) => d.data());
            const checkinMap = Object.fromEntries(checkins.map((c) => [c.fecha, c]));

            // Calcular cumplimiento solo para días de entrenamiento transcurridos
            const diasEntrenamiento = microciclo
              .filter((s) => s.dia <= diasTranscurridos && !s.disciplina.toLowerCase().includes('descanso'))
              .map((s) => ({ ...s, fecha: planDates[s.dia - 1] }));

            const sesionesEsperadas = diasEntrenamiento.length;
            const sesionesCompletadas = diasEntrenamiento.filter(
              (s) => checkinMap[s.fecha]?.sesion_completada === true
            ).length;

            const cumplimiento = sesionesEsperadas > 0
              ? sesionesCompletadas / sesionesEsperadas
              : 1;

            // Calcular días consecutivos perdidos hasta hoy
            let diasPerdidosConsecutivos = 0;
            const sortedDates = [...planDates.filter((d) => d <= today)].reverse();
            for (const fecha of sortedDates) {
              const sesion = microciclo.find((s) => planDates[s.dia - 1] === fecha);
              const esDescanso = !sesion || sesion.disciplina.toLowerCase().includes('descanso');
              const completada = checkinMap[fecha]?.sesion_completada === true;
              if (!esDescanso && !completada) {
                diasPerdidosConsecutivos++;
              } else if (!esDescanso && completada) {
                break;
              }
            }

            // Algoritmo de incumplimiento
            let action;
            if (diasPerdidosConsecutivos <= 2) {
              action = 'continue';
            } else if (diasPerdidosConsecutivos <= 7) {
              action = 'redistribute_50_75';
            } else {
              action = 'conservative_restart';
            }

            const actionLabels = {
              continue: {
                titulo: 'En Carrera',
                descripcion: 'Cumplimiento normal. Continúa el plan sin cambios.',
                color: 'var(--primary)',
              },
              redistribute_50_75: {
                titulo: 'Redistribución Necesaria',
                descripcion: `${diasPerdidosConsecutivos} días perdidos. El Brain redistribuirá el 50-75% del volumen.`,
                color: '#FF7043',
              },
              conservative_restart: {
                titulo: 'Reinicio Conservador',
                descripcion: 'Interrupción prolongada detectada. El Brain generará un plan con el 25-50% de la carga base.',
                color: '#F44336',
              },
            };

            setCompliance({
              action,
              diasPerdidos: diasPerdidosConsecutivos,
              cumplimiento: parseFloat(cumplimiento.toFixed(2)),
              cumplimientoPct: Math.round(cumplimiento * 100),
              sesionesEsperadas,
              sesionesCompletadas,
              diasTranscurridos,
              label: actionLabels[action],
              planFecha: planDates[0],
            });

            setLoading(false);
          },
          () => setLoading(false)
        );
      } catch (err) {
        console.error('useCompliance error:', err);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsubCheckins) unsubCheckins();
    };
  }, []);

  return { compliance, loading };
};

export default useCompliance;
