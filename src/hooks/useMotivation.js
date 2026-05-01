import { useState, useEffect, useRef } from 'react';

const useMotivation = ({ userProfile, checkinHoy, historialSemana, sesionHoy } = {}) => {
  const [motivation, setMotivation] = useState(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${today}_${checkinHoy?.hrv_manual ?? ''}_${checkinHoy?.body_battery ?? ''}`;

    // Usar caché si el checkin no cambió
    if (cacheRef.current?.key === cacheKey && cacheRef.current?.data) {
      setMotivation(cacheRef.current.data);
      return;
    }

    // Solo llamar si hay algún checkin o perfil de usuario
    if (!userProfile?.firstName && !checkinHoy) return;

    const controller = new AbortController();
    setLoading(true);

    fetch('/api/motivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        userProfile,
        checkinHoy,
        historialSemana: historialSemana || [],
        sesionHoy,
        streakDias: historialSemana?.length || 0,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          cacheRef.current = { key: cacheKey, data };
          setMotivation(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [checkinHoy?.hrv_manual, checkinHoy?.body_battery, sesionHoy?.disciplina]);

  return { motivation, loading };
};

export default useMotivation;
