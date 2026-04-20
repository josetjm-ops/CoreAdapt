import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { connectionService } from '../services/ConnectionService';

const STEPS = [
  'info',
  'experience',
  'milestone',
  'resources',
  'disciplines',
  'sync',
  'analysis'
];

const cardStyle = {
  background: '#1c1b1b',
  borderRadius: '1.5rem',
  padding: '1.25rem',
  cursor: 'pointer',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  border: '2px solid transparent'
};

const selectedCardStyle = {
  ...cardStyle,
  borderColor: '#00FF41',
  boxShadow: '0 0 20px rgba(0,255,65,0.12)'
};

const inputStyle = {
  background: '#0e0e0e',
  border: '1px solid #3b4b37',
  borderRadius: '12px',
  color: '#e5e2e1',
  padding: '16px',
  fontSize: '16px',
  fontFamily: 'inherit',
  width: '100%',
  outline: 'none'
};

const Onboarding = ({ onComplete }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('coreAdapt_onboarding_in_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      // We stored the whole object including step, we just want the profile part here
      const { step, ...savedProfile } = parsed;
      return savedProfile;
    }
    return {
      age: '', gender: 'male', height: '', weight: '',
      experience: 'intermediate', disciplines: [], resources: [],
      milestone: '', milestoneDate: '', avatar: 'executive',
      preferredSync: 'none'
    };
  });

  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('coreAdapt_onboarding_in_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Don't remove yet, just get the step
      return parsed.step || 0;
    }
    return 0;
  });

  // Effect to clean up the temporary storage once we've resumed
  useEffect(() => {
    const saved = localStorage.getItem('coreAdapt_onboarding_in_progress');
    if (saved) {
      localStorage.removeItem('coreAdapt_onboarding_in_progress');
    }
  }, []);

  const current = STEPS[step];

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const finish = async () => {
    setLoading(true);
    try {
      // Calculate Profile Arquetype (Avatar)
      let finalAvatar = 'executive';
      const ageNum = parseInt(profile.age);
      if (ageNum < 24) finalAvatar = 'university';
      
      const completeProfile = { ...profile, avatar: finalAvatar, onboardingComplete: true };

      // Save to Firestore
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, completeProfile);
        
        // Sincronizar Onboarding Complete con Google Sheets
        fetch('https://script.google.com/macros/s/AKfycbwUILJYG_mCAZoGzIVNj0n3A72jjOO_qVUbFg8UCkKz9TaneaUzYAf757hAxWb9IR8/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'onboardComplete',
            email: auth.currentUser.email,
            avatar: finalAvatar,
            milestone: profile.milestone,
            preferredSync: profile.preferredSync,
            status: 'Completado'
          })
        }).catch(err => console.error("Error actualizando Google Sheets:", err));
      }

      localStorage.setItem('coreAdaptProfile', JSON.stringify(completeProfile));
      onComplete(completeProfile);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error al guardar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key, value) => {
    setProfile(prev => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]
      };
    });
  };

  const btnPrimary = (label, onClick, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%', padding: '20px', borderRadius: '50px',
        background: disabled ? '#353534' : 'linear-gradient(180deg, #ebffe2 0%, #00FF41 100%)',
        color: disabled ? '#84967e' : '#003907',
        fontWeight: '800', fontSize: '16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        marginTop: '24px', border: 'none', textTransform: 'uppercase'
      }}
    >{loading ? '...' : label}</button>
  );

  const navigate = useNavigate();

  const handleLogout = () => {
    signOut(auth).then(() => {
      localStorage.removeItem('coreAdaptProfile');
      window.location.href = "/";
    });
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', color: '#e5e2e1',
      fontFamily: "'Inter', sans-serif", padding: '40px 24px',
      display: 'flex', flexDirection: 'column', maxWidth: '420px', margin: '0 auto',
      position: 'relative'
    }}>
      <button 
        onClick={handleLogout}
        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#84967e', fontSize: '10px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}
      >
        Cerrar sesión
      </button>

      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.04em' }}>
          Core<span style={{ color: '#00FF41' }}>Adapt</span>
        </h1>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '16px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ width: i === step ? '20px' : '4px', height: '4px', borderRadius: '2px', background: i <= step ? '#00FF41' : '#1c1b1b', transition: 'all 0.3s' }} />
          ))}
        </div>
      </header>

      {/* STEP: Info (Demographics) */}
      {current === 'info' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '32px' }}>Datos Básicos del Atleta</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                  <label style={{ fontSize: '12px', color: '#84967e', display: 'block', marginBottom: '8px' }}>EDAD</label>
                  <input type="number" placeholder="28" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} style={inputStyle} />
               </div>
               <div>
                  <label style={{ fontSize: '12px', color: '#84967e', display: 'block', marginBottom: '8px' }}>GÉNERO</label>
                  <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} style={inputStyle}>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">Otro</option>
                  </select>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                  <label style={{ fontSize: '12px', color: '#84967e', display: 'block', marginBottom: '8px' }}>ALTURA (CM)</label>
                  <input type="number" placeholder="175" value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} style={inputStyle} />
               </div>
               <div>
                  <label style={{ fontSize: '12px', color: '#84967e', display: 'block', marginBottom: '8px' }}>PESO (KG)</label>
                  <input type="number" placeholder="72" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} style={inputStyle} />
               </div>
            </div>
          </div>
          {btnPrimary('CONTINUAR →', next, !profile.age || !profile.height || !profile.weight)}
        </div>
      )}

      {/* STEP: Experience */}
      {current === 'experience' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '32px' }}>Años de Entrenamiento</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { id: 'beginner', label: 'Principiante', desc: 'Menos de 1 año' },
              { id: 'intermediate', label: 'Intermedio', desc: '1 a 3 años practicando deporte' },
              { id: 'advanced', label: 'Avanzado / Pro', desc: 'Más de 3 años o competencia activa' }
            ].map(exp => (
              <div key={exp.id} onClick={() => setProfile({...profile, experience: exp.id})} style={profile.experience === exp.id ? selectedCardStyle : cardStyle}>
                <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>{exp.label}</h4>
                <p style={{ color: '#84967e', fontSize: '14px' }}>{exp.desc}</p>
              </div>
            ))}
          </div>
          {btnPrimary('CONTINUAR →', next)}
        </div>
      )}

      {/* STEP: Milestone */}
      {current === 'milestone' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '32px' }}>¿Cuál es tu Hito principal?</h2>
          <p style={{ color: '#84967e', marginBottom: '32px' }}>Define la meta para la cual CoreAdapt preparará tu cuerpo.</p>
          <input type="text" placeholder="Ej: Maratón de Boston o Bajar 5kg" value={profile.milestone} onChange={e => setProfile({...profile, milestone: e.target.value})} style={{...inputStyle, marginBottom: '16px'}} />
          <input type="date" value={profile.milestoneDate} onChange={e => setProfile({...profile, milestoneDate: e.target.value})} style={{...inputStyle, colorScheme: 'dark'}} />
          {btnPrimary('CONTINUAR →', next, !profile.milestone || !profile.milestoneDate)}
        </div>
      )}

      {/* STEP: Resources */}
      {current === 'resources' && (
         <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '32px' }}>¿Con qué equipo cuentas?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               {[
                 { id: 'bike_road', icon: '🚴', label: 'Bici Ruta' },
                 { id: 'bike_mtb', icon: '🚵', label: 'MTB' },
                 { id: 'gym', icon: '🏋️', label: 'Gimnasio' },
                 { id: 'pool', icon: '🏊', label: 'Piscina' }
               ].map(r => (
                 <div key={r.id} onClick={() => toggle('resources', r.id)} style={profile.resources.includes(r.id) ? selectedCardStyle : cardStyle}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{r.icon}</div>
                    <p style={{ fontWeight: '700', fontSize: '14px' }}>{r.label}</p>
                 </div>
               ))}
            </div>
            {btnPrimary('CONTINUAR →', next)}
         </div>
      )}

      {/* STEP: Disciplines */}
      {current === 'disciplines' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
           <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '32px' }}>¿Qué deportes practicas?</h2>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { id: 'running', icon: '🏃', label: 'Running' },
                { id: 'trail', icon: '⛰️', label: 'Trail' },
                { id: 'ciclismo', icon: '🚴', label: 'Ruta' },
                { id: 'mtb', icon: '🚵', label: 'MTB' },
                { id: 'pesas', icon: '💪', label: 'Pesas' },
                { id: 'natacion', icon: '🏊', label: 'Natación' }
              ].map(d => (
                <div key={d.id} onClick={() => toggle('disciplines', d.id)} style={profile.disciplines.includes(d.id) ? selectedCardStyle : cardStyle}>
                   <div style={{ fontSize: '24px', marginBottom: '8px' }}>{d.icon}</div>
                   <p style={{ fontWeight: '700', fontSize: '14px' }}>{d.label}</p>
                </div>
              ))}
           </div>
           {btnPrimary('CONTINUAR →', next, profile.disciplines.length === 0)}
        </div>
      )}

      {/* STEP: Sync (Connect Garmin/Strava) */}
      {current === 'sync' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
           <h2 style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '8px' }}>Sincronización</h2>
           <p style={{ color: '#84967e', marginBottom: '32px' }}>El Cerebro necesita tus datos biométricos. Elige tu fuente principal (recomendamos solo una para evitar duplicados).</p>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                onClick={() => setProfile({...profile, preferredSync: 'strava'})} 
                style={profile.preferredSync === 'strava' ? selectedCardStyle : cardStyle}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <span style={{ fontSize: '24px' }}>🧡</span>
                       <div>
                          <h4 style={{ fontWeight: '700' }}>Strava</h4>
                          <p style={{ fontSize: '12px', color: '#84967e' }}>Ideal para Running y Ciclismo</p>
                       </div>
                    </div>
                    {connectionService.getStatus('strava')?.connected && <span style={{ color: '#00FF41', fontWeight: '800' }}>CONECTADO ✓</span>}
                 </div>
              </div>

              <div 
                onClick={() => setProfile({...profile, preferredSync: 'garmin'})} 
                style={profile.preferredSync === 'garmin' ? selectedCardStyle : cardStyle}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <span style={{ fontSize: '24px' }}>💙</span>
                       <div>
                          <h4 style={{ fontWeight: '700' }}>Garmin Connect</h4>
                          <p style={{ fontSize: '12px', color: '#84967e' }}>Métricas avanzadas (HRV, Body Battery)</p>
                       </div>
                    </div>
                    {connectionService.getStatus('garmin')?.connected && <span style={{ color: '#00FF41', fontWeight: '800' }}>CONECTADO ✓</span>}
                 </div>
              </div>

              <div 
                onClick={() => setProfile({...profile, preferredSync: 'coros'})} 
                style={profile.preferredSync === 'coros' ? selectedCardStyle : cardStyle}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <span style={{ fontSize: '24px' }}>🔴</span>
                       <div>
                          <h4 style={{ fontWeight: '700' }}>COROS</h4>
                          <p style={{ fontSize: '12px', color: '#84967e' }}>Sincronización de entrenamientos de montaña</p>
                       </div>
                    </div>
                    {connectionService.getStatus('coros')?.connected && <span style={{ color: '#00FF41', fontWeight: '800' }}>CONECTADO ✓</span>}
                 </div>
              </div>

              <div 
                onClick={() => setProfile({...profile, preferredSync: 'apple_health'})} 
                style={profile.preferredSync === 'apple_health' ? selectedCardStyle : cardStyle}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <span style={{ fontSize: '24px' }}>❤️</span>
                       <div>
                          <h4 style={{ fontWeight: '700' }}>Apple Health</h4>
                          <p style={{ fontSize: '12px', color: '#84967e' }}>Datos de iPhone y Apple Watch</p>
                       </div>
                    </div>
                    {connectionService.getStatus('apple_health')?.connected && <span style={{ color: '#00FF41', fontWeight: '800' }}>CONECTADO ✓</span>}
                 </div>
              </div>

              <div 
                onClick={() => setProfile({...profile, preferredSync: 'none'})} 
                style={profile.preferredSync === 'none' ? selectedCardStyle : cardStyle}
              >
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>🚫</span>
                    <div>
                       <h4 style={{ fontWeight: '700' }}>Manual / Sin conexión</h4>
                       <p style={{ fontSize: '12px', color: '#84967e' }}>Ingresaré mis datos manualmente</p>
                    </div>
                 </div>
              </div>
           </div>

           {profile.preferredSync === 'strava' && !connectionService.getStatus('strava')?.connected ? (
             <button
               onClick={() => {
                 localStorage.setItem('coreAdapt_onboarding_in_progress', JSON.stringify({ ...profile, step }));
                 window.location.href = connectionService.getStravaAuthUrl();
               }}
               style={{
                 width: '100%', padding: '16px', borderRadius: '50px', background: '#FC4C02', color: '#fff',
                 fontWeight: '800', fontSize: '14px', border: 'none', marginTop: '24px', cursor: 'pointer', textTransform: 'uppercase'
               }}
             >CONECTAR CON STRAVA ↗</button>
           ) : profile.preferredSync === 'coros' && !connectionService.getStatus('coros')?.connected ? (
             <button
                onClick={() => {
                   alert("Iniciando conexión con COROS... (Sujeto a API Client approval)");
                   connectionService.connect('coros').then(() => next());
                }}
                style={{
                  width: '100%', padding: '16px', borderRadius: '50px', background: '#e51e25', color: '#fff',
                  fontWeight: '800', fontSize: '14px', border: 'none', marginTop: '24px', cursor: 'pointer', textTransform: 'uppercase'
                }}
             >CONECTAR CON COROS ↗</button>
           ) : profile.preferredSync === 'apple_health' && !connectionService.getStatus('apple_health')?.connected ? (
            <button
               onClick={() => {
                  alert("Solicitando permisos de Apple Health... Asegúrate de tener la PWA instalada.");
                  connectionService.connect('apple_health').then(() => next());
               }}
               style={{
                 width: '100%', padding: '16px', borderRadius: '50px', background: '#ffffff', color: '#000',
                 fontWeight: '800', fontSize: '14px', border: '1px solid #000', marginTop: '24px', cursor: 'pointer', textTransform: 'uppercase'
               }}
            >PERMITIR ACCESO SALUD ↗</button>
           ) : (
             btnPrimary('CONTINUAR →', next)
           )}
        </div>
      )}
      {current === 'analysis' && (
        <div style={{ animation: 'fadeIn 0.5s', textAlign: 'center' }}>
          <div style={{ 
            width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0,255,65,0.1)', border: '2px solid #00FF41', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 32px',
            boxShadow: '0 0 40px rgba(0,255,65,0.2)'
          }}>
            {parseInt(profile.age) < 24 ? '🎓' : '💼'}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '16px' }}>Perfil Analizado</h2>
          <p style={{ color: '#84967e', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
            {parseInt(profile.age) < 24 
              ? 'Detectamos un perfil Joven / Universitario. Enfoque en formación de base y motivación visual.' 
              : 'Perfil Ejecutivo de Alto Desempeño. Enfoque en eficiencia de tiempo y recuperación inteligente.'}
          </p>
          
          <div style={{ background: '#131313', padding: '24px', borderRadius: '24px', border: '1px solid #1c1b1b', textAlign: 'left', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
               <span style={{ color: '#84967e' }}>Biometría</span>
               <span style={{ color: '#00FF41' }}>{profile.weight}kg · {profile.height}cm</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ color: '#84967e' }}>Experiencia</span>
               <span style={{ color: '#00FF41' }}>{profile.experience.toUpperCase()}</span>
            </div>
          </div>

          {btnPrimary('ENCENDER EL CEREBRO ✓', finish)}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Onboarding;
