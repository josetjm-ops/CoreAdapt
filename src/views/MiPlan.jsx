import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import DailyCheckinModal from '../components/DailyCheckinModal';
import { 
  Zap, 
  Moon, 
  Activity, 
  Dumbbell, 
  Bike, 
  Waves, 
  Mountain, 
  Brain,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getDaysLeft = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const getMilestoneProgress = (daysLeft, totalDays) => {
  if (!totalDays) return 0;
  return Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));
};

const DISCIPLINE_ICONS = {
  'Running': <Activity size={24} strokeWidth={1.5} />,
  'Trail_Running': <Mountain size={24} strokeWidth={1.5} />,
  'Ruta': <Bike size={24} strokeWidth={1.5} />,
  'MTB': <Bike size={24} strokeWidth={1.5} />,
  'Pesas': <Dumbbell size={24} strokeWidth={1.5} />,
  'Natacion': <Waves size={24} strokeWidth={1.5} />,
  'Descanso': <Moon size={24} strokeWidth={1.5} />
};

// ─── Componente Loader Inmersivo del Orquestador ────────────────────────────
const OrchestratorLoader = ({ step }) => {
  const steps = [
    "Iniciando conexión segura con el Orquestador...",
    "Analizando fatiga reportada contra riesgo estructural...",
    "El Jefe de Entrenamiento está recalculando la carga semanal...",
    "Delegando al Staff de Especialistas (RAG Técnico)...",
    "Adaptando el Micro-Ciclo...",
    "Ensamblando protocolo final..."
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,255,65,0.05) 0%, var(--surface-low) 100%)',
      borderRadius: 'var(--radius-lg)',
      padding: '3rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '260px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '64px', height: '64px',
        borderTop: '3px solid var(--primary)',
        borderRight: '3px solid transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        marginBottom: '2rem'
      }}></div>
      
      <p className="label-md" style={{ color: 'var(--primary)', textAlign: 'center' }}>
        {steps[step] || steps[steps.length - 1]}
      </p>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};


// ─── Lista Dinámica del Microciclo del Orquestador ────────────────────────
const MicrocycleList = ({ plan }) => {
  const especialistas = plan?.especialistas_activos || 'Sistema General';
  const microciclo = Array.isArray(plan?.microciclo) ? plan.microciclo : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Cabecera del Macro-Ciclo */}
      <div className="card-technical" style={{
        background: 'var(--secondary)', padding: '2rem',
        boxShadow: '0 20px 40px rgba(46,91,255,0.15)'
      }}>
        <p className="label-md" style={{ color: '#ebffe2', marginBottom: '0.8rem' }}>
          Strategic Direction
        </p>
        <h2 className="headline-md" style={{ color: '#fff', marginBottom: '1.5rem' }}>
          {plan?.fase_macro || 'Fase de Adaptación Base'}
        </h2>
        
        {/* Insight del Jefe */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '1.5rem' }}>
          <Brain size={20} color="var(--primary)" />
          <div>
            <p className="label-md" style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>Veredicto</p>
            <p style={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.5, fontStyle: 'italic', opacity: 0.9 }}>
              "{plan?.insight_del_jefe || 'Sin veredicto específico.'}"
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
        <Calendar size={14} color="var(--on-surface-variant)" />
        <p className="label-md">Microciclo de 7 Días</p>
      </div>

      {/* Renderizado de los 7 días */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {microciclo.map((diaInfo, index) => {
          const isDescanso = diaInfo.disciplina.toLowerCase().includes('descanso');
          const colorKey = isDescanso ? 'var(--on-surface-variant)' : 'var(--primary)'; 
          
          return (
            <div key={index} className="card-technical" style={{
              background: 'var(--surface-low)',
              padding: '1.75rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <p className="label-md" style={{ color: colorKey, marginBottom: '0.5rem' }}>
                    DÍA {diaInfo.dia} — {especialistas.toUpperCase()}
                  </p>
                  <h3 className="title-lg" style={{ fontWeight: '700' }}>{diaInfo.disciplina}</h3>
                </div>
                <div style={{ color: colorKey }}>
                  {DISCIPLINE_ICONS[diaInfo.disciplina] || <Activity size={24} />}
                </div>
              </div>

              {/* Datos Clave */}
              <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '1.25rem' }}>
                { (diaInfo.duracion_estimada > 0) && (
                  <div>
                    <p className="label-md" style={{ fontSize: '0.6rem' }}>Duración</p>
                    <p className="title-lg" style={{ color: 'var(--on-surface)', fontSize: '1.2rem' }}>{diaInfo.duracion_estimada} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>min</span></p>
                  </div>
                )}
                <div>
                  <p className="label-md" style={{ fontSize: '0.6rem' }}>Objetivo</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: '700', color: colorKey, marginTop: '4px' }}>{diaInfo.objetivo_tecnico}</p>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                {diaInfo.descripcion}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ─── Main MiPlan Component ────────────────────────────────────────────────────
const MiPlan = ({ profile = {} }) => {
  const { t } = useTranslation();
  const [isBrainSyncing, setIsBrainSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState(0);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [brainPlan, setBrainPlan] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const { query, where, getDocs } = await import('firebase/firestore');
          const q = query(
            collection(db, "MiPlan_Ajustes"),
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const docArray = snapshot.docs.map(doc => doc.data());
            docArray.sort((a, b) => {
              const timeA = a.timestamp_generacion?.toMillis ? a.timestamp_generacion.toMillis() : 0;
              const timeB = b.timestamp_generacion?.toMillis ? b.timestamp_generacion.toMillis() : 0;
              return timeB - timeA;
            });
            setBrainPlan(docArray[0].plan_generado);
          }
        } catch (err) {
          console.error("No hay plan previo", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const daysLeft = getDaysLeft(profile.milestoneDate);
  const totalDays = profile.milestoneDate
    ? Math.ceil((new Date(profile.milestoneDate) - new Date(profile.createDate || Date.now() - 30 * 86400000)) / (1000 * 60 * 60 * 24))
    : 120;
  const progress = getMilestoneProgress(daysLeft, totalDays);

  const handleSyncOrchestrator = async (manualData = null) => {
    setShowCheckinModal(false);
    setIsBrainSyncing(true);
    setSyncStep(0);
    setBrainPlan(null);

    const intervalId = setInterval(() => {
      setSyncStep((prev) => (prev < 5 ? prev + 1 : 1));
    }, 1200);

    try {
      const payload = {
        userProfile: {
          avatar: profile?.avatar || "Atleta Amateur",
          milestone: profile?.milestone || "Reto Base 100k"
        },
        biometria: {
          hrv: manualData ? manualData.hrv : 55,
          body_battery: manualData ? manualData.body_battery : 65
        },
        actividad_hoy: {
          rpe_usuario: manualData ? manualData.rpe_usuario : 5,
          rutina_completada: manualData ? manualData.rutina_completada : true
        },
        disponibilidad: "Sin restricciones especiales"
      };

      const res = await fetch('/api/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Fallo en la comunicación con el Servidor Inteligente");
      }

      const finalPlan = await res.json();
      setBrainPlan(finalPlan);

      if (auth.currentUser) {
        const historyRef = collection(db, "MiPlan_Ajustes");
        await addDoc(historyRef, {
          userId: auth.currentUser.uid,
          email: auth.currentUser.email,
          timestamp_generacion: serverTimestamp(),
          plan_generado: finalPlan
        });
      }

    } catch (error) {
      console.error(error);
      alert(error.message || "Interferencia conectando con CoreAdapt.");
    } finally {
      clearInterval(intervalId);
      setIsBrainSyncing(false);
    }
  };

  return (
    <div style={{ padding: '3rem 1.5rem 10rem', color: 'var(--on-surface)', maxWidth: '480px', margin: '0 auto' }}>

      {/* Header */}
      <header style={{ marginBottom: '3rem' }}>
        <p className="label-md" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
          Cognitive Load Management
        </p>
        <h1 className="headline-md" style={{ fontSize: '2.2rem', lineHeight: 1 }}>
          Mi Plan Estratégico
        </h1>
      </header>

      {/* Milestone Card */}
      <section className="card-technical" style={{
        marginBottom: '2.5rem',
        background: 'linear-gradient(135deg, var(--surface-low) 0%, var(--surface-lowest) 100%)',
        borderTop: '2px solid var(--primary)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={14} color="var(--primary)" />
              <p className="label-md" style={{ color: 'var(--primary)' }}>Objective</p>
            </div>
            <h2 className="title-lg" style={{ fontWeight: '800', letterSpacing: '-0.02em' }}>
              {profile.milestone || '100km Trail Race'}
            </h2>
          </div>
          {daysLeft !== null && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)', lineHeight: 1 }}>{daysLeft}</p>
              <p className="label-md" style={{ fontSize: '0.6rem' }}>Días Meta</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <p className="label-md" style={{ fontSize: '0.65rem' }}>Macrocycle Completion</p>
            <p className="label-md" style={{ color: 'var(--primary)' }}>{progress}%</p>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--surface-lowest)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'var(--primary)',
              boxShadow: '0 0 10px var(--primary-glow)',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </div>
      </section>

      {/* Interfaz del Orquestador de IA */}
      <section style={{ marginBottom: '2rem' }}>
        { !isBrainSyncing && !brainPlan && (
           <button 
             onClick={handleSyncOrchestrator}
             className="btn-lithium"
             style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
           >
             <Brain size={20} /> Consultar Orquestador
           </button>
        )}

        { isBrainSyncing && <OrchestratorLoader step={syncStep} /> }

        { !isBrainSyncing && brainPlan && (
          <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
             <MicrocycleList plan={brainPlan} />
             
             <button 
                onClick={() => setShowCheckinModal(true)}
                style={{
                  width: '100%', padding: '1.2rem', borderRadius: 'var(--radius-full)',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--on-surface-variant)',
                  fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', marginTop: '3rem',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem'
                }}
             >
               <ClipboardList size={18} /> Reportar Sesión de Hoy
             </button>
          </div>
        )}
      </section>

      { showCheckinModal && (
        <DailyCheckinModal 
          onClose={() => setShowCheckinModal(false)}
          onSubmit={handleSyncOrchestrator}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default MiPlan;
