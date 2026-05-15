import React, { useState } from 'react';
import { CheckCircle2, XCircle, Zap, Activity, Settings2, ChevronRight, Heart } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getPersonalUID } from '../services/PersonalUser';

const DailyCheckinModal = ({ onClose, onSubmit }) => {
  const [completado, setCompletado] = useState(true);
  const [rpe, setRpe] = useState(5);
  const [battery, setBattery] = useState(70);
  const [hrv, setHrv] = useState(55);
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const uid = getPersonalUID();
      const fecha = new Date().toISOString().split('T')[0];
      const checkinData = {
        userId: uid,
        fecha,
        timestamp: serverTimestamp(),
        body_battery: parseInt(battery),
        hrv_manual: parseInt(hrv),
        rpe_sesion: completado ? parseInt(rpe) : 0,
        sesion_completada: completado,
        notas: notas.trim()
      };

      await setDoc(doc(db, 'Checkins', `${uid}_${fecha}`), checkinData);

      onSubmit({
        rutina_completada: completado,
        rpe_usuario: checkinData.rpe_sesion,
        body_battery: checkinData.body_battery,
        hrv_manual: checkinData.hrv_manual,
        notas: checkinData.notas
      });
    } catch (err) {
      console.error('Error guardando checkin:', err);
      // No bloqueamos la UX si falla Firestore — el modal sigue fluyendo
      onSubmit({ rutina_completada: completado, rpe_usuario: completado ? parseInt(rpe) : 0, body_battery: parseInt(battery), hrv_manual: parseInt(hrv), notas: notas.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(12px)', padding: '1.5rem'
    }}>
      <div className="card-technical" style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--surface-low)',
        padding: '2.5rem 2rem',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
        animation: 'modalOpen 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Settings2 size={18} color="var(--primary)" />
          <h2 className="headline-md" style={{ margin: 0, fontSize: '1.8rem' }}>Check-in</h2>
        </div>

        <p className="label-md" style={{ marginBottom: '2.5rem', opacity: 0.7 }}>
          El Orquestador adaptará tu semana basándose en este reporte.
        </p>

        {/* Toggle Realizado / No Realizado */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p className="label-md" style={{ color: 'var(--on-surface)', marginBottom: '1rem' }}>Estado de la Sesión</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setCompletado(true)}
              style={{
                flex: 1, padding: '1.25rem', borderRadius: 'var(--radius-lg)', fontWeight: '700',
                background: completado ? 'rgba(0,255,65,0.1)' : 'var(--surface-lowest)',
                color: completado ? 'var(--primary)' : 'var(--on-surface-variant)',
                border: completado ? '1px solid var(--primary)' : '1px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
              }}
            >
              <CheckCircle2 size={24} strokeWidth={completado ? 2 : 1.5} />
              <span className="label-md" style={{ fontSize: '0.65rem' }}>Completada</span>
            </button>
            <button
              onClick={() => setCompletado(false)}
              style={{
                flex: 1, padding: '1.25rem', borderRadius: 'var(--radius-lg)', fontWeight: '700',
                background: !completado ? 'rgba(255,59,48,0.1)' : 'var(--surface-lowest)',
                color: !completado ? '#FF3B30' : 'var(--on-surface-variant)',
                border: !completado ? '1px solid #FF3B30' : '1px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
              }}
            >
              <XCircle size={24} strokeWidth={!completado ? 2 : 1.5} />
              <span className="label-md" style={{ fontSize: '0.65rem' }}>Omitida</span>
            </button>
          </div>
        </div>

        {/* RPE Slider */}
        {completado && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Activity size={14} color="var(--amber)" />
                <label className="label-md" style={{ color: 'var(--on-surface)' }}>Fatiga (RPE)</label>
              </div>
              <span className="title-lg" style={{ color: rpe > 7 ? '#FF3B30' : 'var(--amber)', fontSize: '1.5rem' }}>{rpe}</span>
            </div>
            <input type="range" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)}
              className="rest-slider" style={{ width: '100%', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span className="label-md" style={{ fontSize: '0.6rem' }}>Muy Suave</span>
              <span className="label-md" style={{ fontSize: '0.6rem' }}>Extremo</span>
            </div>
          </div>
        )}

        {/* HRV Slider */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Heart size={14} color="var(--secondary)" />
              <label className="label-md" style={{ color: 'var(--on-surface)' }}>HRV esta mañana</label>
            </div>
            <span className="title-lg" style={{ color: 'var(--secondary)', fontSize: '1.5rem' }}>{hrv} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>ms</span></span>
          </div>
          <input type="range" min="20" max="120" step="1" value={hrv} onChange={(e) => setHrv(e.target.value)}
            className="rest-slider" style={{ width: '100%', cursor: 'pointer' }} />
          <p className="label-md" style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '0.4rem' }}>
            De tu Garmin, Polar o reloj. Rango típico atleta: 40-90ms.
          </p>
        </div>

        {/* Body Battery Slider */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={14} color="var(--primary)" />
              <label className="label-md" style={{ color: 'var(--on-surface)' }}>Carga de Energía</label>
            </div>
            <span className="title-lg" style={{ color: battery < 40 ? '#FF3B30' : 'var(--primary)', fontSize: '1.5rem' }}>{battery}%</span>
          </div>
          <input type="range" min="10" max="100" step="5" value={battery} onChange={(e) => setBattery(e.target.value)}
            className="rest-slider" style={{ width: '100%', cursor: 'pointer' }} />
        </div>

        {/* Notas */}
        <div style={{ marginBottom: '2.5rem' }}>
          <label className="label-md" style={{ color: 'var(--on-surface)', display: 'block', marginBottom: '0.75rem' }}>
            Notas del día <span style={{ opacity: 0.4 }}>(opcional)</span>
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Cómo te sentiste, dolor, clima, sueño..."
            rows={2}
            style={{
              width: '100%', background: 'var(--surface-lowest)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'var(--on-surface)',
              fontSize: '0.9rem', resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={onClose} className="label-md" style={{
            flex: 1, padding: '1rem', background: 'transparent', border: 'none',
            color: 'var(--on-surface-variant)', cursor: 'pointer', textAlign: 'center'
          }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-lithium"
            style={{ flex: 2, padding: '1.1rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando...' : <><span>Sincronizar</span><ChevronRight size={16} /></>}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalOpen {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .rest-slider { -webkit-appearance: none; height: 6px; background: var(--surface-lowest); border-radius: 5px; outline: none; }
        .rest-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #fff; border-radius: 50%; cursor: pointer; box-shadow: 0 0 10px rgba(0,255,65,0.4); }
      `}</style>
    </div>
  );
};

export default DailyCheckinModal;
