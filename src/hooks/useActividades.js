import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getPersonalUID } from '../services/PersonalUser';

const useActividades = (limitCount = 7) => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = getPersonalUID();

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().split('T')[0];

    const q = query(
      collection(db, 'Actividades'),
      where('userId', '==', uid),
      where('fecha', '>=', sinceStr),
      orderBy('fecha', 'desc'),
      limit(limitCount)
    );

    const unsub = onSnapshot(q, (snap) => {
      setActividades(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [limitCount]);

  return { actividades, loading };
};

export default useActividades;
