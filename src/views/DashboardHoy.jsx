import { useState } from 'react';
import { Zap, Activity, Brain, Heart, Plus, ClipboardList, MessageCircle, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import useMiPlan from '../hooks/useMiPlan';
import useCheckins from '../hooks/useCheckins';
import useMotivation from '../hooks/useMotivation';
import DailyCheckinModal from '../components/DailyCheckinModal';
import LogEntrenamientoModal from '../components/LogEntrenamientoModal';
import CoachChatModal from '../components/CoachChatModal';
import { DISCIPLINE_ICONS } from '../constants/icons';

const getBatteryColor = (v) => v > 70 ? 'var(--primary)' : v > 40 ? '#FFBF00' : '#FF3B30';
const getBatteryLabel = (v) => v > 70 ? '● Óptimo' : v > 40 ? '● Moderado' : '● Bajo';
const getBatteryStatus = (v) => v > 70 ? 'Ready for Output' : v > 40 ? 'Zona de carga' : 'Recuperación';

const TONO_COLOR = {
  energizante: 'var(--primary)',
  calmo: 'var(--secondary)',
  moderado: '#FFBF00',
  celebrativo: '#FFD700',
  reconectado: 'var(--secondary)',
  épico: 'var(--primary)',
  tapering: '#FFBF00',
};

// ─── Alerta crítica de sobreentrenamiento ─────────────────────────────────────
const SobreentrenamientoAlert = ({ downtrend }) => {
  if (!downtrend?.sobreentrenamiento) return null;
  return (
    <div style={{
      marginBottom: '1.5rem',
      padding: '1.25rem 1.5rem',
      background: 'rgba(244,67,54,0.1)',
      border: '1px solid rgba(244,67,54,0.4)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex', gap: '1rem', alignItems: 'flex-start',
    }}>
      <AlertTriangle size={20} color="#F44336" style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontSize: '0.8rem', fontWeight: '800', color: '#F44336', marginBottom: '0.3rem', letterSpacing: '0.04em' }}>
          SOBREENTRENAMIENTO DETECTADO
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(244,67,54,0.8)', lineHeight: 1.5 }}>
          HRV descendió {downtrend.caida_pct}% sostenido los últimos 7 días.
          Protocolo activado: reducir carga 50%, cancelar HIIT y fuerza pesada hasta recuperación.
        </p>
      </div>
    </div>
  );
};

// ─── HRV Trend Indicator ──────────────────────────────────────────────────────
const HRVTrendBadge = ({ hrv, avgHRV7d }) => {
  if (!hrv || !avgHRV7d) return null;
  const ratio = hrv / avgHRV7d;
  const isBaja = ratio < 0.85;
  const color = isBaja ? '#FF7043' : 'var(--primary)';
  const Icon = isBaja ? TrendingDown : TrendingUp;
  const label = isBaja
    ? `${Math.round((1 - ratio) * 100)}% bajo promedio`
    : 'Tendencia normal';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
      <Icon size={11} color={color} />
      <span style={{ fontSize: '0.65rem', color, fontWeight: '600' }}>{label}</span>
    </div>
  );
};

// ─── ACWR Mini Gauge ──────────────────────────────────────────────────────────
const ACWRGauge = ({ acwr, acwrStatus }) => {
  if (!acwr || !acwrStatus || acwrStatus.zone === 'unknown') return null;

  // Posición del indicador en la barra (0.8-1.5 range visible → 0%-100%)
  const minVal = 0.6, maxVal = 1.6;
  const pct = Math.max(0, Math.min(100, ((acwr - minVal) / (maxVal - minVal)) * 100));

  return (
    <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: 'var(--surface-lowest)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p className="label-md" style={{ fontSize: '0.6rem' }}>ACWR — Ratio de Carga</p>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: acwrStatus.color }}>{acwr}</span>
      </div>

      {/* Barra de zonas */}
      <div style={{ position: 'relative', height: 6, borderRadius: 6, overflow: 'hidden', background: 'var(--surface-high)' }}>
        <div style={{ position: 'absolute', left: 0, width: '27%', height: '100%', background: '#FFA726' }} />   {/* subcarga */}
        <div style={{ position: 'absolute', left: '27%', width: '37%', height: '100%', background: '#2ECC71' }} /> {/* óptimo 0.8-1.3 */}
        <div style={{ position: 'absolute', left: '64%', width: '13%', height: '100%', background: '#FF7043' }} /> {/* precaución */}
        <div style={{ position: 'absolute', left: '77%', width: '23%', height: '100%', background: '#F44336' }} /> {/* peligro */}
        {/* Indicador */}
        <div style={{
          position: 'absolute', top: -2, left: `calc(${pct}% - 5px)`,
          width: 10, height: 10, borderRadius: '50%',
          background: '#fff', border: `2px solid ${acwrStatus.color}`,
          boxShadow: `0 0 6px ${acwrStatus.color}`,
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
        <span style={{ fontSize: '0.55rem', color: 'var(--on-surface-variant)' }}>0.6</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--primary)' }}>0.8 – 1.3 óptimo</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--on-surface-variant)' }}>1.6</span>
      </div>

      <p style={{ fontSize: '0.68rem', color: acwrStatus.color, marginTop: '0.4rem', fontWeight: '600' }}>
        {acwrStatus.action}
      </p>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const DashboardHoy = ({ profile = {} }) => {
  const { brainPlan, diaActual } = useMiPlan();
  const {
    todayCheckin,
    last7Checkins,
    avgHRV7d,
    acwr,
    acwrStatus,
    sobreentrenamiento,
    hrvDowntrend,
  } = useCheckins();

  const sesionHoy = brainPlan?.microciclo?.[diaActual] || null;
  const { motivation } = useMotivation({ userProfile: profile, checkinHoy: todayCheckin, sesionHoy });

  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showCoachChat, setShowCoachChat] = useState(false);

  const todayStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });
  const bodyBattery = todayCheckin?.body_battery ?? null;
  const hrvHoy = todayCheckin?.hrv_manual ?? null;

  const initial = (profile.firstName || 'A').charAt(0).toUpperCase();

  return (
    <div style={{ padding: '3rem 1.5rem 10rem', color: 'var(--on-surface)' }}>

      <header style={{ marginBottom: '2rem' }}>
        <p className="label-md" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{todayStr}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 className="headline-md" style={{ fontSize: '2.2rem', lineHeight: 1 }}>
            Hola, {profile.firstName || 'Atleta'}
          </h1>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--surface-high) 0%, var(--surface-lowest) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)',
            border: '1px solid rgba(0,255,65,0.2)',
          }}>
            {initial}
          </div>
        </div>
      </header>

      {/* Alerta crítica de sobreentrenamiento (prioritaria sobre todo) */}
      <SobreentrenamientoAlert downtrend={hrvDowntrend} />

      {/* Energía vital + HRV + ACWR */}
      {bodyBattery !== null ? (
        <section className="card-technical" style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, var(--surface-low) 0%, var(--surface-lowest) 100%)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
            <div>
              <p className="label-md">Energía Vital</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                <span className="display-lg" style={{ color: getBatteryColor(bodyBattery) }}>{bodyBattery}</span>
                <span className="label-md" style={{ opacity: 0.6 }}>%</span>
              </div>

              {/* HRV hoy + trend */}
              {hrvHoy && (
                <div style={{ marginTop: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Heart size={12} color="var(--secondary)" />
                    <span className="label-md" style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>
                      HRV {hrvHoy} ms
                      {avgHRV7d && <span style={{ opacity: 0.5 }}> · prom 7d: {avgHRV7d}ms</span>}
                    </span>
                  </div>
                  <HRVTrendBadge hrv={hrvHoy} avgHRV7d={avgHRV7d} />
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <p className="label-md">Estado</p>
              <p className="title-lg" style={{ fontWeight: '700' }}>{getBatteryStatus(bodyBattery)}</p>
              <p className="label-md" style={{ color: getBatteryColor(bodyBattery), marginTop: '2px' }}>
                {getBatteryLabel(bodyBattery)}
              </p>
            </div>
          </div>

          {/* ACWR gauge integrado en la tarjeta de biometría */}
          <ACWRGauge acwr={acwr} acwrStatus={acwrStatus} />
        </section>
      ) : (
        <section style={{
          marginBottom: '2rem', padding: '1.5rem',
          background: 'rgba(0,255,65,0.05)', borderRadius: 'var(--radius-lg)',
          border: '1px dashed rgba(0,255,65,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p className="label-md" style={{ color: 'var(--primary)', marginBottom: '0.3rem' }}>Check-in matutino</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
              Registra HRV y energía para activar el Orquestador.
            </p>
            {/* Mostrar ACWR aunque no haya check-in hoy */}
            {acwr && acwrStatus && acwrStatus.zone !== 'unknown' && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: acwrStatus.color }} />
                <span style={{ fontSize: '0.65rem', color: acwrStatus.color, fontWeight: '700' }}>
                  ACWR {acwr} — {acwrStatus.zone === 'optimal' ? 'Carga óptima' : acwrStatus.label}
                </span>
              </div>
            )}
          </div>
          <button onClick={() => setShowCheckinModal(true)} style={{
            background: 'var(--primary)', border: 'none', width: '44px', height: '44px',
            borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 0 20px rgba(0,255,65,0.4)',
          }}>
            <Plus size={20} color="#0a0a0a" strokeWidth={2.5} />
          </button>
        </section>
      )}

      {/* Sesión del día */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Zap size={16} color="var(--primary)" />
          <h2 className="label-md" style={{ color: 'var(--primary)' }}>Core Strategy</h2>
          {brainPlan && (
            <span className="label-md" style={{ fontSize: '0.6rem', opacity: 0.5 }}>
              · DÍA {diaActual + 1} DE 7
            </span>
          )}
          {/* ACWR danger badge en el header de sesión */}
          {acwrStatus?.zone === 'danger' && (
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(244,67,54,0.15)', border: '1px solid rgba(244,67,54,0.3)',
            }}>
              <AlertTriangle size={10} color="#F44336" />
              <span style={{ fontSize: '0.55rem', color: '#F44336', fontWeight: '700' }}>ACWR PELIGRO</span>
            </div>
          )}
        </div>

        {sesionHoy ? (
          <div className="card-technical" style={{ background: 'var(--surface-high)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <p className="label-md" style={{ color: 'var(--secondary)' }}>
                  {brainPlan.fase_macro?.toUpperCase() || 'MICRO-CICLO ACTIVO'}
                </p>
                <h3 className="headline-md" style={{ marginTop: '0.4rem' }}>{sesionHoy.disciplina}</h3>
              </div>
              <div style={{ color: 'var(--primary)' }}>
                {DISCIPLINE_ICONS[sesionHoy.disciplina] || <Activity size={24} />}
              </div>
            </div>

            <p style={{ fontSize: '1rem', color: 'var(--on-surface)', lineHeight: 1.6, marginBottom: '1.5rem', opacity: 0.9 }}>
              {sesionHoy.descripcion}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--surface-lowest)', borderRadius: '1rem' }}>
                <p className="label-md">Duración</p>
                <p className="title-lg" style={{ color: 'var(--on-surface)' }}>
                  {sesionHoy.duracion_estimada} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>min</span>
                </p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--surface-lowest)', borderRadius: '1rem' }}>
                <p className="label-md">Enfoque</p>
                <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)', marginTop: '4px' }}>
                  {sesionHoy.objetivo_tecnico}
                </p>
              </div>
            </div>

            {/* Nutrición de la sesión si existe */}
            {sesionHoy.nutricion && sesionHoy.duracion_estimada > 0 && (
              <div style={{
                marginBottom: '1.25rem', padding: '0.75rem 1rem',
                background: 'rgba(0,255,65,0.05)', borderRadius: 'var(--radius-md)',
                borderLeft: '2px solid var(--primary)',
              }}>
                <p className="label-md" style={{ fontSize: '0.6rem', marginBottom: '0.25rem' }}>Nutrición hoy</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                  {sesionHoy.nutricion.objetivo_kcal_total} kcal · P {sesionHoy.nutricion.proteina_g}g · C {sesionHoy.nutricion.carbos_g}g
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--primary)', opacity: 0.8, fontStyle: 'italic', marginTop: '0.2rem' }}>
                  {sesionHoy.nutricion.timing_clave}
                </p>
              </div>
            )}

            <button onClick={() => setShowLogModal(true)} style={{
              width: '100%', padding: '0.875rem', borderRadius: 'var(--radius-full)',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--on-surface-variant)', fontSize: '0.8rem', fontWeight: '700',
              cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
            }}>
              <ClipboardList size={16} /> Registrar Sesión
            </button>
          </div>
        ) : (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
            <p className="label-md" style={{ marginBottom: '1rem' }}>Sin plan activo</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>
              Genera tu microciclo en la pestaña de plan.
            </p>
          </div>
        )}
      </section>

      {/* Coach Alpha */}
      <section className="glass" style={{
        borderRadius: 'var(--radius-lg)', padding: '1.5rem',
        borderLeft: `2px solid ${TONO_COLOR[motivation?.tono] || 'var(--primary)'}`,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <Brain size={18} color={TONO_COLOR[motivation?.tono] || 'var(--primary)'} strokeWidth={2} />
            <p className="label-md" style={{ color: TONO_COLOR[motivation?.tono] || 'var(--primary)' }}>
              Coach Alpha
              {motivation?.tono && (
                <span style={{ opacity: 0.6, fontSize: '0.6rem', marginLeft: '0.4rem' }}>· {motivation.tono}</span>
              )}
            </p>
          </div>
          <button onClick={() => setShowCoachChat(true)} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-full)', padding: '0.4rem 0.875rem',
            color: 'var(--on-surface-variant)', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer',
          }}>
            <MessageCircle size={14} /> Hablar
          </button>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, fontStyle: 'italic' }}>
          "{motivation?.mensaje || brainPlan?.insight_del_jefe || 'Sincronizando variables biométricas...'}"
        </p>
        {motivation?.accion_sugerida && (
          <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.75rem', fontWeight: '600' }}>
            → {motivation.accion_sugerida}
          </p>
        )}
      </section>

      {showCheckinModal && (
        <DailyCheckinModal onClose={() => setShowCheckinModal(false)} onSubmit={() => setShowCheckinModal(false)} />
      )}
      {showLogModal && (
        <LogEntrenamientoModal onClose={() => setShowLogModal(false)} sesionPlanHoy={sesionHoy} />
      )}
      {showCoachChat && (
        <CoachChatModal
          onClose={() => setShowCoachChat(false)}
          userProfile={profile}
          checkinHoy={todayCheckin}
          sesionHoy={sesionHoy}
          historialSemana={last7Checkins}
          initialMessage={motivation?.mensaje}
        />
      )}
    </div>
  );
};

export default DashboardHoy;
