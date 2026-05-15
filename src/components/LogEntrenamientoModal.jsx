import { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getPersonalUID } from '../services/PersonalUser';
import { X, CheckCircle } from 'lucide-react';
import { DISCIPLINE_ICONS } from '../constants/icons';

const TIPOS = ['Running', 'Trail', 'MTB', 'Pesas', 'Natacion'];

const TODAY = () => new Date().toISOString().split('T')[0];

const LogEntrenamientoModal = ({ onClose, sesionPlanHoy = null }) => {
  const [tipo, setTipo] = useState(sesionPlanHoy?.disciplina || 'Running');
  const [duracion, setDuracion] = useState(sesionPlanHoy?.duracion_estimada || '');
  const [distancia, setDistancia] = useState('');
  const [elevacion, setElevacion] = useState('');
  const [rpe, setRpe] = useState(6);
  const [notas, setNotas] = useState('');
  const [completada, setCompletada] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const uid = getPersonalUID();
    setSaving(true);

    try {
      await addDoc(collection(db, 'Actividades'), {
        userId: uid,
        fecha: TODAY(),
        timestamp: serverTimestamp(),
        tipo,
        fuente: 'manual',
        duracion_min: duracion ? parseInt(duracion) : null,
        distancia_km: distancia ? parseFloat(distancia) : null,
        elevacion_m: elevacion ? parseInt(elevacion) : null,
        rpe: parseInt(rpe),
        completada,
        notas,
        sesion_plan_dia: sesionPlanHoy?.dia || null,
        strava_id: null,
        fc_media: null,
      });
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error guardando el entrenamiento.');
    } finally {
      setSaving(false);
    }
  };

  const showDistancia = ['Running', 'Trail', 'MTB'].includes(tipo);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', zIndex: 2000,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div style={{
        background: 'var(--surface-low)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        padding: '2rem 1.5rem 3rem', maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className="title-lg" style={{ fontWeight: '800' }}>Registrar Entrenamiento</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
            <X size={22} />
          </button>
        </div>

        {/* Tipo de actividad */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="label-md" style={{ marginBottom: '0.75rem' }}>Disciplina</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {TIPOS.map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                  background: tipo === t ? 'var(--primary)' : 'var(--surface-high)',
                  color: tipo === t ? '#0a0a0a' : 'var(--on-surface-variant)',
                  border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700',
                }}
              >
                <span style={{ color: tipo === t ? '#0a0a0a' : 'var(--primary)' }}>
                  {DISCIPLINE_ICONS[t]}
                </span>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ¿Sesión completada? */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface-high)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: '700' }}>¿Sesión completada?</p>
          <button
            onClick={() => setCompletada(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: completada ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: '700', fontSize: '0.85rem' }}
          >
            <CheckCircle size={20} /> {completada ? 'Sí' : 'No'}
          </button>
        </div>

        {/* Duración */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p className="label-md" style={{ marginBottom: '0.5rem' }}>Duración (min)</p>
          <input
            type="number" value={duracion} onChange={e => setDuracion(e.target.value)}
            placeholder="60"
            style={{ width: '100%', padding: '0.875rem', background: 'var(--surface-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* Distancia (solo para running/trail/mtb) */}
        {showDistancia && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <p className="label-md" style={{ marginBottom: '0.5rem' }}>Distancia (km)</p>
              <input type="number" step="0.1" value={distancia} onChange={e => setDistancia(e.target.value)} placeholder="10.5"
                style={{ width: '100%', padding: '0.875rem', background: 'var(--surface-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
            {(tipo === 'Trail') && (
              <div>
                <p className="label-md" style={{ marginBottom: '0.5rem' }}>Elevación (m D+)</p>
                <input type="number" value={elevacion} onChange={e => setElevacion(e.target.value)} placeholder="500"
                  style={{ width: '100%', padding: '0.875rem', background: 'var(--surface-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>
        )}

        {/* RPE */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <p className="label-md">Esfuerzo percibido (RPE)</p>
            <p className="label-md" style={{ color: 'var(--primary)', fontSize: '1rem', fontWeight: '800' }}>{rpe}/10</p>
          </div>
          <input type="range" min="1" max="10" value={rpe} onChange={e => setRpe(e.target.value)}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
        </div>

        {/* Notas */}
        <div style={{ marginBottom: '2rem' }}>
          <p className="label-md" style={{ marginBottom: '0.5rem' }}>Notas (opcional)</p>
          <textarea
            value={notas} onChange={e => setNotas(e.target.value)}
            placeholder="Cómo te sentiste, condiciones, etc."
            rows={2}
            style={{ width: '100%', padding: '0.875rem', background: 'var(--surface-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', color: 'var(--on-surface)', fontSize: '0.9rem', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn-lithium"
          style={{ width: '100%', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Guardando...' : 'Registrar Entrenamiento'}
        </button>
      </div>
    </div>
  );
};

export default LogEntrenamientoModal;
