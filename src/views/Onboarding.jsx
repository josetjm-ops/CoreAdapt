import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { connectionService } from '../services/ConnectionService';
import {
  COLORS,
  CARD_STYLE,
  CARD_SELECTED_STYLE,
  ONBOARDING_INPUT_STYLE,
  BTN_PRIMARY_STYLE,
  BTN_PRIMARY_DISABLED_STYLE,
  FADE_IN_KEYFRAMES,
} from '../constants/theme';
import { postToSheets } from '../constants/api';

const STEPS = ['info', 'experience', 'milestone', 'resources', 'disciplines', 'sync', 'analysis'];

const Onboarding = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('coreAdapt_onboarding_in_progress');
    if (saved) {
      const { step, ...savedProfile } = JSON.parse(saved);
      return savedProfile;
    }
    return {
      age: '', gender: 'male', height: '', weight: '',
      experience: 'intermediate', disciplines: [], resources: [],
      milestone: '', milestoneDate: '', avatar: 'executive',
      preferredSync: 'none',
    };
  });

  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('coreAdapt_onboarding_in_progress');
    return saved ? JSON.parse(saved).step || 0 : 0;
  });

  useEffect(() => {
    localStorage.removeItem('coreAdapt_onboarding_in_progress');
  }, []);

  const navigate = useNavigate();
  const current = STEPS[step];
  const next = () => { if (step < STEPS.length - 1) setStep((s) => s + 1); };

  const finish = async () => {
    setLoading(true);
    try {
      const finalAvatar = parseInt(profile.age) < 24 ? 'university' : 'executive';
      const completeProfile = { ...profile, avatar: finalAvatar, onboardingComplete: true };

      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), completeProfile);
        postToSheets({
          action: 'onboardComplete',
          email: auth.currentUser.email,
          avatar: finalAvatar,
          milestone: profile.milestone,
          preferredSync: profile.preferredSync,
          status: 'Completado',
        });
      }

      localStorage.setItem('coreAdaptProfile', JSON.stringify(completeProfile));
      onComplete(completeProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key, value) => {
    setProfile((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] };
    });
  };

  const set = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.value }));

  const BtnPrimary = ({ label, onClick, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={disabled ? BTN_PRIMARY_DISABLED_STYLE : BTN_PRIMARY_STYLE}
    >
      {loading ? '...' : label}
    </button>
  );

  const handleLogout = () =>
    signOut(auth).then(() => {
      localStorage.removeItem('coreAdaptProfile');
      window.location.href = '/';
    });

  return (
    <div style={{
      minHeight: '100vh', background: COLORS.bgDeep, color: COLORS.text,
      fontFamily: "'Inter', sans-serif", padding: '40px 24px',
      display: 'flex', flexDirection: 'column', maxWidth: '420px', margin: '0 auto',
      position: 'relative',
    }}>
      <button
        onClick={handleLogout}
        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: COLORS.textMuted, fontSize: '10px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}
      >
        Cerrar sesión
      </button>

      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.04em' }}>
          Core<span style={{ color: COLORS.primary }}>Adapt</span>
        </h1>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '16px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ width: i === step ? '20px' : '4px', height: '4px', borderRadius: '2px', background: i <= step ? COLORS.primary : COLORS.surface, transition: 'all 0.3s' }} />
          ))}
        </div>
      </header>

      {/* STEP: Info */}
      {current === 'info' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '32px' }}>Datos Básicos del Atleta</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>EDAD</label>
                <input type="number" placeholder="28" value={profile.age} onChange={set('age')} style={ONBOARDING_INPUT_STYLE} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>GÉNERO</label>
                <select value={profile.gender} onChange={set('gender')} style={ONBOARDING_INPUT_STYLE}>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>ALTURA (CM)</label>
                <input type="number" placeholder="175" value={profile.height} onChange={set('height')} style={ONBOARDING_INPUT_STYLE} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>PESO (KG)</label>
                <input type="number" placeholder="72" value={profile.weight} onChange={set('weight')} style={ONBOARDING_INPUT_STYLE} />
              </div>
            </div>
          </div>
          <BtnPrimary label="CONTINUAR →" onClick={next} disabled={!profile.age || !profile.height || !profile.weight} />
        </div>
      )}

      {/* STEP: Experience */}
      {current === 'experience' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '32px' }}>Años de Entrenamiento</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { id: 'beginner',     label: 'Principiante',    desc: 'Menos de 1 año' },
              { id: 'intermediate', label: 'Intermedio',      desc: '1 a 3 años practicando deporte' },
              { id: 'advanced',     label: 'Avanzado / Pro',  desc: 'Más de 3 años o competencia activa' },
            ].map((exp) => (
              <div key={exp.id} onClick={() => setProfile({ ...profile, experience: exp.id })} style={profile.experience === exp.id ? CARD_SELECTED_STYLE : CARD_STYLE}>
                <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>{exp.label}</h4>
                <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>{exp.desc}</p>
              </div>
            ))}
          </div>
          <BtnPrimary label="CONTINUAR →" onClick={next} />
        </div>
      )}

      {/* STEP: Milestone */}
      {current === 'milestone' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '32px' }}>¿Cuál es tu Hito principal?</h2>
          <p style={{ color: COLORS.textMuted, marginBottom: '32px' }}>Define la meta para la cual CoreAdapt preparará tu cuerpo.</p>
          <input type="text" placeholder="Ej: Maratón de Boston o Bajar 5kg" value={profile.milestone} onChange={set('milestone')} style={{ ...ONBOARDING_INPUT_STYLE, marginBottom: '16px' }} />
          <input type="date" value={profile.milestoneDate} onChange={set('milestoneDate')} style={{ ...ONBOARDING_INPUT_STYLE, colorScheme: 'dark' }} />
          <BtnPrimary label="CONTINUAR →" onClick={next} disabled={!profile.milestone || !profile.milestoneDate} />
        </div>
      )}

      {/* STEP: Resources */}
      {current === 'resources' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '32px' }}>¿Con qué equipo cuentas?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { id: 'bike_road', icon: '🚴', label: 'Bici Ruta' },
              { id: 'bike_mtb',  icon: '🚵', label: 'MTB' },
              { id: 'gym',       icon: '🏋️', label: 'Gimnasio' },
              { id: 'pool',      icon: '🏊', label: 'Piscina' },
            ].map((r) => (
              <div key={r.id} onClick={() => toggle('resources', r.id)} style={profile.resources.includes(r.id) ? CARD_SELECTED_STYLE : CARD_STYLE}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{r.icon}</div>
                <p style={{ fontWeight: '700', fontSize: '14px' }}>{r.label}</p>
              </div>
            ))}
          </div>
          <BtnPrimary label="CONTINUAR →" onClick={next} />
        </div>
      )}

      {/* STEP: Disciplines */}
      {current === 'disciplines' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '32px' }}>¿Qué deportes practicas?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { id: 'running',  icon: '🏃', label: 'Running' },
              { id: 'trail',    icon: '⛰️', label: 'Trail' },
              { id: 'ciclismo', icon: '🚴', label: 'Ruta' },
              { id: 'mtb',      icon: '🚵', label: 'MTB' },
              { id: 'pesas',    icon: '💪', label: 'Pesas' },
              { id: 'natacion', icon: '🏊', label: 'Natación' },
            ].map((d) => (
              <div key={d.id} onClick={() => toggle('disciplines', d.id)} style={profile.disciplines.includes(d.id) ? CARD_SELECTED_STYLE : CARD_STYLE}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{d.icon}</div>
                <p style={{ fontWeight: '700', fontSize: '14px' }}>{d.label}</p>
              </div>
            ))}
          </div>
          <BtnPrimary label="CONTINUAR →" onClick={next} disabled={profile.disciplines.length === 0} />
        </div>
      )}

      {/* STEP: Sync */}
      {current === 'sync' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '8px' }}>Sincronización</h2>
          <p style={{ color: COLORS.textMuted, marginBottom: '32px' }}>El Cerebro necesita tus datos biométricos. Elige tu fuente principal.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { id: 'strava',       icon: '🧡', name: 'Strava',           desc: 'Ideal para Running y Ciclismo' },
              { id: 'garmin',       icon: '💙', name: 'Garmin Connect',   desc: 'Métricas avanzadas (HRV, Body Battery)' },
              { id: 'coros',        icon: '🔴', name: 'COROS',            desc: 'Sincronización de entrenamientos de montaña' },
              { id: 'apple_health', icon: '❤️', name: 'Apple Health',     desc: 'Datos de iPhone y Apple Watch' },
              { id: 'none',         icon: '🚫', name: 'Manual / Sin conexión', desc: 'Ingresaré mis datos manualmente' },
            ].map((src) => (
              <div key={src.id} onClick={() => setProfile({ ...profile, preferredSync: src.id })} style={profile.preferredSync === src.id ? CARD_SELECTED_STYLE : CARD_STYLE}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{src.icon}</span>
                    <div>
                      <h4 style={{ fontWeight: '700' }}>{src.name}</h4>
                      <p style={{ fontSize: '12px', color: COLORS.textMuted }}>{src.desc}</p>
                    </div>
                  </div>
                  {src.id !== 'none' && connectionService.getStatus(src.id)?.connected && (
                    <span style={{ color: COLORS.primary, fontWeight: '800' }}>CONECTADO ✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {profile.preferredSync === 'strava' && !connectionService.getStatus('strava')?.connected ? (
            <button
              onClick={() => {
                localStorage.setItem('coreAdapt_onboarding_in_progress', JSON.stringify({ ...profile, step }));
                window.location.href = connectionService.getStravaAuthUrl();
              }}
              style={{ width: '100%', padding: '16px', borderRadius: '50px', background: COLORS.strava, color: '#fff', fontWeight: '800', fontSize: '14px', border: 'none', marginTop: '24px', cursor: 'pointer', textTransform: 'uppercase' }}
            >CONECTAR CON STRAVA ↗</button>
          ) : profile.preferredSync === 'coros' && !connectionService.getStatus('coros')?.connected ? (
            <button
              onClick={() => { alert('Iniciando conexión con COROS... (Sujeto a API Client approval)'); connectionService.connect('coros').then(() => next()); }}
              style={{ width: '100%', padding: '16px', borderRadius: '50px', background: COLORS.coros, color: '#fff', fontWeight: '800', fontSize: '14px', border: 'none', marginTop: '24px', cursor: 'pointer', textTransform: 'uppercase' }}
            >CONECTAR CON COROS ↗</button>
          ) : profile.preferredSync === 'apple_health' && !connectionService.getStatus('apple_health')?.connected ? (
            <button
              onClick={() => { alert('Solicitando permisos de Apple Health...'); connectionService.connect('apple_health').then(() => next()); }}
              style={{ width: '100%', padding: '16px', borderRadius: '50px', background: '#ffffff', color: '#000', fontWeight: '800', fontSize: '14px', border: '1px solid #000', marginTop: '24px', cursor: 'pointer', textTransform: 'uppercase' }}
            >PERMITIR ACCESO SALUD ↗</button>
          ) : (
            <BtnPrimary label="CONTINUAR →" onClick={next} />
          )}
        </div>
      )}

      {/* STEP: Analysis */}
      {current === 'analysis' && (
        <div style={{ animation: 'fadeIn 0.5s', textAlign: 'center' }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0,255,65,0.1)',
            border: `2px solid ${COLORS.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', margin: '0 auto 32px', boxShadow: '0 0 40px rgba(0,255,65,0.2)',
          }}>
            {parseInt(profile.age) < 24 ? '🎓' : '💼'}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '16px' }}>Perfil Analizado</h2>
          <p style={{ color: COLORS.textMuted, fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
            {parseInt(profile.age) < 24
              ? 'Detectamos un perfil Joven / Universitario. Enfoque en formación de base y motivación visual.'
              : 'Perfil Ejecutivo de Alto Desempeño. Enfoque en eficiencia de tiempo y recuperación inteligente.'}
          </p>
          <div style={{ background: COLORS.bg, padding: '24px', borderRadius: '24px', border: `1px solid ${COLORS.surface}`, textAlign: 'left', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: COLORS.textMuted }}>Biometría</span>
              <span style={{ color: COLORS.primary }}>{profile.weight}kg · {profile.height}cm</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: COLORS.textMuted }}>Experiencia</span>
              <span style={{ color: COLORS.primary }}>{profile.experience.toUpperCase()}</span>
            </div>
          </div>
          <BtnPrimary label="ENCENDER EL CEREBRO ✓" onClick={finish} />
        </div>
      )}

      <style>{FADE_IN_KEYFRAMES}</style>
    </div>
  );
};

export default Onboarding;
