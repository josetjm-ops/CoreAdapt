import { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import DailyCheckinModal from '../components/DailyCheckinModal';
import { Activity, Brain, TrendingUp, Calendar, ClipboardList, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { DISCIPLINE_ICONS } from '../constants/icons';
import { getDaysLeft, getMilestoneProgress } from '../utils/helpers';
import { BRAIN_API } from '../constants/api';
import { FADE_IN_KEYFRAMES } from '../constants/theme';
import useMiPlan from '../hooks/useMiPlan';
import useCheckins from '../hooks/useCheckins';
import useActividades from '../hooks/useActividades';
import useCompliance from '../hooks/useCompliance';

// ─── ACWR Badge ───────────────────────────────────────────────────────────────
const ACWRBadge = ({ acwrStatus }) => {
  if (!acwrStatus || acwrStatus.zone === 'unknown') return null;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)',
      background: `${acwrStatus.color}22`, border: `1px solid ${acwrStatus.color}44`,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: acwrStatus.color }} />
      <span style={{ fontSize: '0.65rem', fontWeight: '700', color: acwrStatus.color, letterSpacing: '0.05em' }}>
        {acwrStatus.label}
      </span>
    </div>
  );
};

// ─── Compliance Panel ─────────────────────────────────────────────────────────
const CompliancePanel = ({ compliance }) => {
  if (!compliance || compliance.sesionesEsperadas === 0) return null;

  const { label, cumplimientoPct, sesionesCompletadas, sesionesEsperadas, action } = compliance;
  if (!label) return null;

  const iconMap = {
    continue: <ShieldCheck size={16} color={label.color} />,
    redistribute_50_75: <AlertTriangle size={16} color={label.color} />,
    conservative_restart: <AlertTriangle size={16} color={label.color} />,
  };

  return (
    <div style={{
      background: `${label.color}11`,
      border: `1px solid ${label.color}33`,
      borderRadius: 'var(--radius-md)',
      padding: '1rem 1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {iconMap[action]}
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: label.color }}>
          {label.titulo}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: '700', color: label.color }}>
          {cumplimientoPct}%
        </span>
      </div>
      <div style={{ width: '100%', height: 4, background: 'var(--surface-lowest)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${cumplimientoPct}%`, height: '100%', background: label.color, transition: 'width 0.8s ease' }} />
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
        {sesionesCompletadas}/{sesionesEsperadas} sesiones · {label.descripcion}
      </p>
    </div>
  );
};

// ─── Juez Validation Badge ────────────────────────────────────────────────────
const JuezBadge = ({ juezValidacion }) => {
  if (!juezValidacion) return null;
  const color = juezValidacion.aprobado ? 'var(--primary)' : '#F44336';
  const label = juezValidacion.aprobado
    ? `Aprobado — Riesgo ${juezValidacion.nivel_riesgo}`
    : `Rechazado — ${juezValidacion.violaciones?.length || 0} violaciones`;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)',
      background: `${color}15`, border: `1px solid ${color}33`,
    }}>
      <ShieldCheck size={11} color={color} />
      <span style={{ fontSize: '0.6rem', fontWeight: '700', color }}>El Juez: {label}</span>
    </div>
  );
};

// ─── Loader inmersivo ─────────────────────────────────────────────────────────
const OrchestratorLoader = ({ step }) => {
  const steps = [
    'Iniciando conexión segura con el Orquestador...',
    'Analizando fatiga reportada contra riesgo estructural...',
    'El Jefe de Entrenamiento está recalculando la carga...',
    'Delegando al Staff de Especialistas (RAG Técnico)...',
    'El Juez valida el plan contra criterios de seguridad médica...',
    'Ensamblando protocolo final...',
  ];
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,255,65,0.05) 0%, var(--surface-low) 100%)',
      borderRadius: 'var(--radius-lg)', padding: '3rem 2rem',
      display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '260px',
    }}>
      <div style={{
        width: 64, height: 64,
        borderTop: '3px solid var(--primary)', borderRight: '3px solid transparent',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '2rem',
      }} />
      <p className="label-md" style={{ color: 'var(--primary)', textAlign: 'center' }}>
        {steps[step] || steps[steps.length - 1]}
      </p>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── Microciclo List ──────────────────────────────────────────────────────────
const MicrocycleList = ({ plan, diaActual }) => {
  const microciclo = Array.isArray(plan?.microciclo) ? plan.microciclo : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header del plan */}
      <div className="card-technical" style={{ background: 'var(--secondary)', padding: '2rem', boxShadow: '0 20px 40px rgba(46,91,255,0.15)' }}>
        <p className="label-md" style={{ color: '#ebffe2', marginBottom: '0.5rem' }}>Strategic Direction</p>
        <h2 className="headline-md" style={{ color: '#fff', marginBottom: '0.5rem' }}>
          {plan?.fase_macro || 'Fase de Adaptación Base'}
        </h2>

        {/* Macrophase pills */}
        {plan?.macrophase && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span style={{
              fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.06em',
              padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.12)', color: '#fff',
            }}>
              MACROCICLO: {plan.macrophase.fase.toUpperCase()}
            </span>
            <span style={{
              fontSize: '0.6rem', fontWeight: '700',
              padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
            }}>
              {plan.macrophase.pct?.toFixed(0)}% PROGRESO
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '1.5rem' }}>
          <Brain size={20} color="var(--primary)" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <p className="label-md" style={{ color: 'var(--primary)' }}>Veredicto</p>
              {plan?.juez_validacion && <JuezBadge juezValidacion={plan.juez_validacion} />}
            </div>
            <p style={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.5, fontStyle: 'italic', opacity: 0.9 }}>
              "{plan?.insight_del_jefe || 'Sin veredicto.'}"
            </p>
          </div>
        </div>

        {/* Alerta sobreentrenamiento */}
        {plan?.alerta_sobreentreno && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#F4433622', padding: '0.75rem 1rem', borderRadius: '1rem', border: '1px solid #F4433644' }}>
            <AlertTriangle size={16} color="#F44336" />
            <span style={{ fontSize: '0.75rem', color: '#F44336', fontWeight: '700' }}>
              Alerta de Sobreentrenamiento — Semana de recuperación prescrita
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
        <Calendar size={14} color="var(--on-surface-variant)" />
        <p className="label-md">Microciclo de 7 Días</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {microciclo.map((diaInfo, index) => {
          const isDescanso = diaInfo.disciplina.toLowerCase().includes('descanso');
          const isHoy = index === diaActual;
          const colorKey = isDescanso ? 'var(--on-surface-variant)' : 'var(--primary)';

          return (
            <div key={index} className="card-technical" style={{
              background: isHoy ? 'linear-gradient(135deg, rgba(0,255,65,0.07) 0%, var(--surface-low) 100%)' : 'var(--surface-low)',
              padding: '1.75rem',
              border: isHoy ? '1px solid rgba(0,255,65,0.25)' : '1px solid transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <p className="label-md" style={{ color: colorKey }}>
                      DÍA {diaInfo.dia}
                    </p>
                    {isHoy && (
                      <span style={{ fontSize: '0.55rem', fontWeight: '800', color: 'var(--primary)', background: 'rgba(0,255,65,0.15)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)' }}>
                        HOY
                      </span>
                    )}
                  </div>
                  <h3 className="title-lg" style={{ fontWeight: '700' }}>{diaInfo.disciplina}</h3>
                </div>
                <div style={{ color: colorKey }}>
                  {DISCIPLINE_ICONS[diaInfo.disciplina] || <Activity size={24} />}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '1.25rem' }}>
                {diaInfo.duracion_estimada > 0 && (
                  <div>
                    <p className="label-md" style={{ fontSize: '0.6rem' }}>Duración</p>
                    <p className="title-lg" style={{ color: 'var(--on-surface)', fontSize: '1.2rem' }}>
                      {diaInfo.duracion_estimada} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>min</span>
                    </p>
                  </div>
                )}
                <div>
                  <p className="label-md" style={{ fontSize: '0.6rem' }}>Objetivo</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: '700', color: colorKey, marginTop: 4 }}>{diaInfo.objetivo_tecnico}</p>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: diaInfo.nutricion ? '1rem' : 0 }}>
                {diaInfo.descripcion}
              </p>

              {/* Nutrición del día */}
              {diaInfo.nutricion && diaInfo.duracion_estimada > 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(0,255,65,0.05)', borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--primary)' }}>
                  <p className="label-md" style={{ fontSize: '0.6rem', marginBottom: '0.3rem' }}>Nutrición</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    {diaInfo.nutricion.objetivo_kcal_total} kcal · P {diaInfo.nutricion.proteina_g}g · C {diaInfo.nutricion.carbos_g}g · G {diaInfo.nutricion.grasas_g}g
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--primary)', opacity: 0.8, fontStyle: 'italic' }}>
                    {diaInfo.nutricion.timing_clave}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main MiPlan ─────────────────────────────────────────────────────────────
const MiPlan = ({ profile = {} }) => {
  const { brainPlan, setBrainPlan, diaActual } = useMiPlan();
  const { todayCheckin, avgHRV7d, acwr, acwrStatus, sobreentrenamiento } = useCheckins();
  const { actividades } = useActividades();
  const { compliance } = useCompliance();
  const [isBrainSyncing, setIsBrainSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState(0);
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  const daysLeft = getDaysLeft(profile.milestoneDate);
  const totalDays = profile.milestoneDate
    ? Math.ceil((new Date(profile.milestoneDate) - new Date(profile.createDate || Date.now() - 30 * 86400000)) / 86400000)
    : 120;
  const progress = getMilestoneProgress(daysLeft, totalDays);

  const handleSyncOrchestrator = async (manualData = null) => {
    setShowCheckinModal(false);
    setIsBrainSyncing(true);
    setSyncStep(0);
    setBrainPlan(null);

    const intervalId = setInterval(() => setSyncStep((prev) => (prev < 5 ? prev + 1 : 1)), 1400);

    try {
      const payload = {
        userProfile: {
          firstName: profile?.firstName,
          disciplines: profile?.disciplines || [],
          milestone: profile?.milestone,
          milestoneDate: profile?.milestoneDate,
          experience: profile?.experience,
          resources: profile?.resources,
          age: profile?.age,
          weight: profile?.weight,
          createDate: profile?.createDate,
        },
        biometria: {
          hrv_manual: manualData?.hrv_manual ?? todayCheckin?.hrv_manual ?? 55,
          body_battery: manualData?.body_battery ?? todayCheckin?.body_battery ?? 65,
          avg_hrv_7d: avgHRV7d ?? 55,
          acwr: acwr ?? null,
          acwr_zona: acwrStatus?.zone ?? 'unknown',
          sobreentrenamiento_detectado: sobreentrenamiento || false,
          hrv_tendencia: (manualData?.hrv_manual ?? todayCheckin?.hrv_manual ?? 55) >= (avgHRV7d ?? 55) * 0.85 ? 'normal' : 'BAJA',
        },
        actividad_hoy: {
          rpe_usuario: manualData?.rpe_usuario ?? todayCheckin?.rpe_sesion ?? 5,
          sesion_completada: manualData?.rutina_completada ?? todayCheckin?.sesion_completada ?? true,
          notas: manualData?.notas ?? todayCheckin?.notas ?? '',
        },
        // Algoritmo de incumplimiento — el Brain ajusta el plan según compliance
        compliance: compliance ? {
          action: compliance.action,
          diasPerdidos: compliance.diasPerdidos,
          cumplimiento: compliance.cumplimiento,
        } : null,
      };

      const res = await fetch(BRAIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Fallo en la comunicación con el Servidor Inteligente');
      }

      const finalPlan = await res.json();
      setBrainPlan(finalPlan);

      if (auth.currentUser) {
        await addDoc(collection(db, 'MiPlan_Ajustes'), {
          userId: auth.currentUser.uid,
          email: auth.currentUser.email,
          timestamp_generacion: serverTimestamp(),
          plan_generado: finalPlan,
        });
      }
    } catch (error) {
      console.error(error);
      alert(error.message || 'Interferencia conectando con CoreAdapt.');
    } finally {
      clearInterval(intervalId);
      setIsBrainSyncing(false);
    }
  };

  return (
    <div style={{ padding: '3rem 1.5rem 10rem', color: 'var(--on-surface)', maxWidth: '480px', margin: '0 auto' }}>

      <header style={{ marginBottom: '3rem' }}>
        <p className="label-md" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Cognitive Load Management</p>
        <h1 className="headline-md" style={{ fontSize: '2.2rem', lineHeight: 1 }}>Mi Plan Estratégico</h1>
      </header>

      {/* Objetivo + progreso macrociclo */}
      <section className="card-technical" style={{
        marginBottom: '1.5rem',
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
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <p className="label-md" style={{ fontSize: '0.65rem' }}>Macrocycle Completion</p>
            <p className="label-md" style={{ color: 'var(--primary)' }}>{progress}%</p>
          </div>
          <div style={{ width: '100%', height: 6, background: 'var(--surface-lowest)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)', transition: 'width 1s ease' }} />
          </div>
        </div>
      </section>

      {/* ACWR + Compliance en paralelo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        {acwrStatus && acwrStatus.zone !== 'unknown' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)' }}>
            <Zap size={16} color={acwrStatus.color} />
            <div style={{ flex: 1 }}>
              <ACWRBadge acwrStatus={acwrStatus} />
              <p style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
                {acwrStatus.action}
              </p>
            </div>
          </div>
        )}
        <CompliancePanel compliance={compliance} />
      </div>

      {/* Plan section */}
      <section style={{ marginBottom: '2rem' }}>
        {!isBrainSyncing && !brainPlan && (
          <button
            onClick={handleSyncOrchestrator}
            className="btn-lithium"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
          >
            <Brain size={20} /> Consultar Orquestador
          </button>
        )}

        {isBrainSyncing && <OrchestratorLoader step={syncStep} />}

        {!isBrainSyncing && brainPlan && (
          <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
            <MicrocycleList plan={brainPlan} diaActual={diaActual} />

            {/* Historial de sesiones */}
            {actividades.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', marginLeft: '0.5rem' }}>
                  <ClipboardList size={14} color="var(--on-surface-variant)" />
                  <p className="label-md">Esta Semana</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {actividades.map((act) => (
                    <div key={act.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1rem 1.25rem', background: 'var(--surface-low)', borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: act.completada ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                          {act.completada ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        </span>
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{act.tipo}</p>
                          <p className="label-md" style={{ fontSize: '0.6rem' }}>{act.fecha} · {act.duracion_min ?? '?'} min</p>
                        </div>
                      </div>
                      {act.rpe && <p className="label-md" style={{ color: 'var(--primary)' }}>RPE {act.rpe}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '3rem' }}>
              <button
                onClick={() => setShowCheckinModal(true)}
                style={{
                  width: '100%', padding: '1.2rem', borderRadius: 'var(--radius-full)',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--on-surface-variant)', fontSize: '0.8rem', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem',
                }}
              >
                <ClipboardList size={18} /> Reportar Sesión de Hoy
              </button>

              <button
                onClick={handleSyncOrchestrator}
                style={{
                  width: '100%', padding: '1rem', borderRadius: 'var(--radius-full)',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                }}
              >
                <Brain size={14} /> Regenerar Plan
              </button>
            </div>
          </div>
        )}
      </section>

      {showCheckinModal && (
        <DailyCheckinModal onClose={() => setShowCheckinModal(false)} onSubmit={handleSyncOrchestrator} />
      )}

      <style>{FADE_IN_KEYFRAMES}</style>
    </div>
  );
};

export default MiPlan;
