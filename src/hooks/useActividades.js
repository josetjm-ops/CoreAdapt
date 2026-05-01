import { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const useActividades = (limitCount = 7) => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};

    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setActividades([]);
        setLoading(false);
        return;
      }

      const since = new Date();
      since.setDate(since.getDate() - 7);
      const sinceStr = since.toISOString().split('T')[0];

      const q = query(
        collection(db, 'Actividades'),
        where('userId', '==', user.uid),
        where('fecha', '>=', sinceStr),
        orderBy('fecha', 'desc'),
        limit(limitCount)
      );

      unsub = onSnapshot(q, (snap) => {
        setActividades(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, () => setLoading(false));
    });

    return () => { authUnsub(); unsub(); };
  }, [limitCount]);

  return { actividades, loading };
};

export default useActividades;
