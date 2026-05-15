import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getPersonalUID } from '../services/PersonalUser';

const TODAY = () => new Date().toISOString().split('T')[0];

const calcMacrosTarget = (profile, actividadIntensidad = 'moderada') => {
  const peso = profile?.weight || 70;
  const factorMap = { baja: 1.3, moderada: 1.55, alta: 1.75 };
  const factor = factorMap[actividadIntensidad] || 1.55;

  return {
    kcal: Math.round(peso * 22 * factor),
    proteina_g: Math.round(peso * 2.0),
    carbos_g: Math.round((peso * 22 * factor * 0.50) / 4),
    grasas_g: Math.round((peso * 22 * factor * 0.25) / 9),
    agua_ml: Math.round(peso * 35 + (actividadIntensidad === 'alta' ? 700 : actividadIntensidad === 'moderada' ? 400 : 0)),
  };
};

const sumMacros = (entries) => entries.reduce(
  (acc, e) => ({
    kcal: acc.kcal + (e.kcal || 0),
    proteina_g: acc.proteina_g + (e.proteina_g || 0),
    carbos_g: acc.carbos_g + (e.carbos_g || 0),
    grasas_g: acc.grasas_g + (e.grasas_g || 0),
  }),
  { kcal: 0, proteina_g: 0, carbos_g: 0, grasas_g: 0 }
);

const useNutricion = (profile = {}, actividadIntensidad = 'moderada') => {
  const [foodLog, setFoodLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = getPersonalUID();

    const q = query(
      collection(db, 'RegistrosComida'),
      where('userId', '==', uid),
      where('fecha', '==', TODAY()),
      orderBy('hora', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setFoodLog(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, []);

  const addFoodEntry = useCallback(async (entry) => {
    const uid = getPersonalUID();

    await addDoc(collection(db, 'RegistrosComida'), {
      ...entry,
      userId: uid,
      fecha: TODAY(),
      timestamp: serverTimestamp(),
    });
  }, []);

  const macrosTarget = calcMacrosTarget(profile, actividadIntensidad);
  const macrosConsumed = sumMacros(foodLog);

  return {
    foodLog,
    macrosConsumed,
    macrosTarget,
    loading,
    addFoodEntry,
  };
};

export default useNutricion;
