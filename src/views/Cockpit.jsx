import React, { useState } from 'react';
import { connectionService } from '../services/ConnectionService';
import { BrainService } from '../services/BrainService';
import { normalizeGarminData } from '../services/GarminDataNormalizer';
import { seedProtocols } from '../services/ProtocolSeeder';
import { COLORS } from '../constants/theme';
import { DISCIPLINE_EMOJI } from '../constants/icons';
import { resetProfile, saveProfile } from '../services/PersonalUser';
import useCheckins from '../hooks/useCheckins';

// ─── Constants ────────────────────────────────────────────────────────────────

const APIS_METADATA = [
  { id: 'garmin',            name: 'Garmin Connect',           icon: '⌚', detail: 'HRV · Body Battery · Actividades' },
  { id: 'strava',            name: 'Strava',                   icon: '🧡', detail: 'Segmentos · KOMs · Social' },
  { id: 'apple_health',      name: 'Apple Health',             icon: '🍏', detail: 'Sueño · Pasos · Anillos' },
  { id: 'coros',             name: 'COROS',                    icon: '🏃', detail: 'Métricas de Fatiga · Carga de Entrenamiento' },
  { id: 'alpha_intelligence', name: 'Inteligencia Técnica Alpha', icon: '🧠', detail: 'Base de Conocimiento · Protocolos RAG' },
];

const GEAR_ITEMS = [
  { id: 'tarmac', icon: '🚴', name: 'S-Works Tarmac SL8',  type: 'Ciclismo de Ruta', stat: '4,280 km', statLabel: 'Acumulado' },
  { id: 'epic',   icon: '🚵', name: 'Specialized Epic',    type: 'MTB',              stat: '1,640 km', statLabel: 'Acumulado' },
  { id: 'gym',    icon: '🏋️', name: 'Performance Center', type: 'Gimnasio',          stat: '3x / sem', statLabel: 'Frecuencia' },
  { id: 'pool',   icon: '🏊', name: 'Olympic Pool Pro',    type: 'Natación',          stat: '2x / sem', statLabel: 'Frecuencia' },
];

const AVATAR_LABELS = { executive: '💼 Ejecutivo', university: '🎓 Universitario' };

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <p style={{ fontSize: '0.65rem', color: COLORS.textMuted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
    {children}
  </p>
);

const Toggle = ({ label, desc, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: `1px solid ${COLORS.surface}` }}>
    <div style={{ flex: 1, paddingRight: '1rem' }}>
      <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{label}</p>
      <p style={{ color: COLORS.textMuted, fontSize: '0.75rem', marginTop: '2px' }}>{desc}</p>
    </div>
    <div
      onClick={() => onChange(!value)}
      style={{
        width: '48px', height: '26px', borderRadius: '13px', flexShrink: 0,
        background: value ? COLORS.primary : '#2a2a2a', position: 'relative', cursor: 'pointer',
        transition: 'background 0.25s', boxShadow: value ? '0 0 12px rgba(0,255,65,0.4)' : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: '3px', left: value ? '25px' : '3px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: value ? COLORS.primaryDark : COLORS.textMuted, transition: 'left 0.25s',
      }} />
    </div>
  </div>
);

const ApiCard = ({ apiMeta, status, onAction }) => {
  const isConnected = status?.connected;
  const statusColor = isConnected ? COLORS.primary : COLORS.textMuted;
  const statusLabel = isConnected ? 'Conectado' : 'Desconectado';

  return (
    <div style={{ background: COLORS.surface, borderRadius: '1.25rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '0.75rem', flexShrink: 0, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
        {apiMeta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{apiMeta.name}</p>
          <span style={{ fontSize: '0.6rem', fontWeight: '700', color: statusColor, background: `${statusColor}15`, borderRadius: '9999px', padding: '2px 8px', flexShrink: 0 }}>
            {statusLabel}
          </span>
        </div>
        <p style={{ color: COLORS.textMuted, fontSize: '0.75rem', marginTop: '2px' }}>{apiMeta.detail}</p>
        {status?.lastSync && (
          <p style={{ color: COLORS.border, fontSize: '0.65rem', marginTop: '2px', textTransform: 'uppercase' }}>
            Última sincronización: {new Date(status.lastSync).toLocaleTimeString()}
          </p>
        )}
      </div>
      <button
        onClick={() => onAction(apiMeta.id, isConnected)}
        style={{
          background: isConnected ? '#2a2a2a' : `linear-gradient(180deg, #ebffe2 0%, ${COLORS.primary} 100%)`,
          border: 'none', padding: '0.5rem 0.75rem', borderRadius: '9999px',
          color: isConnected ? COLORS.text : COLORS.primaryDark,
          fontWeight: '700', fontSize: '0.7rem', cursor: 'pointer', minWidth: '80px', fontFamily: 'inherit',
        }}
      >
        {isConnected ? 'Desconectar' : 'Conectar'}
      </button>
    </div>
  );
};

const GearCard = ({ gear }) => (
  <div style={{ background: COLORS.surface, borderRadius: '1.25rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', flexShrink: 0, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
      {gear.icon}
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{gear.name}</p>
      <p style={{ color: COLORS.textMuted, fontSize: '0.75rem' }}>{gear.type}</p>
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <p style={{ fontWeight: '800', fontSize: '1rem', color: COLORS.primary }}>{gear.stat}</p>
      <p style={{ color: COLORS.textMuted, fontSize: '0.6rem' }}>{gear.statLabel}</p>
    </div>
  </div>
);

// ─── Main Cockpit Component ───────────────────────────────────────────────────

const Cockpit = ({ profile = {}, setProfile }) => {
  const { todayCheckin, avgHRV7d, avgBattery7d } = useCheckins();
  const [connections, setConnections] = useState(connectionService.getAllStatus());

  const biometrics = [
    {
      label: 'HRV',
      value: todayCheckin?.hrv_manual ? `${todayCheckin.hrv_manual} ms` : (avgHRV7d ? `${avgHRV7d} ms` : '-- ms'),
      sub: avgHRV7d ? `promedio 7d: ${avgHRV7d}ms` : 'sin datos',
      color: COLORS.primary
    },
    {
      label: 'Body Battery',
      value: todayCheckin?.body_battery != null ? `${todayCheckin.body_battery}` : (avgBattery7d ? `${avgBattery7d}` : '--'),
      sub: '/ 100',
      color: COLORS.primary
    },
    {
      label: 'RPE Último',
      value: todayCheckin?.rpe_sesion != null ? `${todayCheckin.rpe_sesion}` : '--',
      sub: '/ 10',
      color: COLORS.secondary
    },
    {
      label: 'Sesión',
      value: todayCheckin ? (todayCheckin.sesion_completada ? '✓' : '✗') : '--',
      sub: todayCheckin ? (todayCheckin.sesion_completada ? 'Completada' : 'Omitida') : 'sin checkin',
      color: todayCheckin?.sesion_completada ? COLORS.primary : COLORS.textSoft
    },
  ];
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [settings, setSettings] = useState({ privacy: true, automation: true, notifications: true });

  const handleApiAction = async (serviceId, isConnected) => {
    if (isConnected) {
      connectionService.disconnect(serviceId);
    } else {
      await connectionService.connect(serviceId);
    }
    setConnections(connectionService.getAllStatus());
  };

  const toggleSetting = (key) => (val) => setSettings((s) => ({ ...s, [key]: val }));

  const handleReset = () => {
    if (window.confirm('¿Reiniciar la configuración? Se perderá la configuración actual.')) {
      resetProfile();
      window.location.reload();
    }
  };

  const simulateSync = async () => {
    const rawGarmin = { hrv: 40, bodyBattery: 35, restingHR: 48 };
    const history = [{ hrv: 58 }, { hrv: 60 }, { hrv: 55 }, { hrv: 62 }];
    const normalized = normalizeGarminData(rawGarmin, history);
    const biometria = { hrv: normalized.hrv, body_battery: normalized.body_battery, fc_reposo: normalized.fc_reposo };
    const objetivo = { meta_nombre: profile.milestone, dias_restantes: 30 };
    const actividad = { cumplimiento_bool: false, rpe_usuario: 9, tss_carga: 150 };
    alert('Simulando Sincronización... HRV Bajo (40ms) detectado.');
    const result = await BrainService.getAthleteInsight(profile, biometria, actividad, objetivo);
    console.log('AI Feedback:', result);
    if (result.alerta_sobreentreno) alert('⚠️ CEREBRO: Alerta de sobreentrenamiento activada.');
  };

  const [seedingProtocols, setSeedingProtocols] = useState(false);
  const handleSeedProtocols = async () => {
    if (!window.confirm('¿Cargar / actualizar los 17 Protocolos Alpha v3.0 en Firestore?\n\nEsta operación es segura: sobrescribe sin duplicar.')) return;
    setSeedingProtocols(true);
    const ok = await seedProtocols();
    setSeedingProtocols(false);
    alert(ok
      ? '✅ 17 Protocolos Alpha v3.0 cargados correctamente.\nAtletismo, Ruta, AMPK/mTOR y más ya están disponibles para el RAG.'
      : '❌ Error al cargar protocolos. Revisa la consola.');
  };

  const disciplines = profile.disciplines || [];
  const resources = profile.resources || [];

  return (
    <div style={{ padding: '2rem 1.5rem 9rem', fontFamily: "'Inter', sans-serif", color: COLORS.text, maxWidth: '480px', margin: '0 auto' }}>

      <header style={{ marginBottom: '2rem' }}>
        <p style={{ color: COLORS.textSoft, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Panel de Control
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', marginTop: '0.1rem' }}>
          Configuración
        </h1>
      </header>

      {/* Athlete Profile Card */}
      <section style={{ background: COLORS.surface, borderRadius: '1.5rem', padding: '1.5rem', marginBottom: '1.5rem', borderTop: `2px solid ${COLORS.secondary}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${COLORS.secondary}22 0%, ${COLORS.primary}22 100%)`,
            border: `2px solid ${COLORS.secondary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          }}>
            {profile.avatar === 'executive' ? '💼' : '🎓'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>{profile.firstName || 'Atleta CoreAdapt'}</p>
            <p style={{ color: COLORS.textSoft, fontSize: '0.8rem', marginTop: '2px' }}>{profile.milestone || 'Hito no configurado'}</p>
            {profile.milestoneDate && (
              <p style={{ color: COLORS.secondary, fontSize: '0.72rem', fontWeight: '700', marginTop: '2px' }}>
                📅 {new Date(profile.milestoneDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
        {disciplines.length > 0 && (
          <div>
            <p style={{ fontSize: '0.65rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Disciplinas Activas</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {disciplines.map((d) => (
                <span key={d} style={{ background: '#2a2a2a', borderRadius: '9999px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: '600' }}>
                  {DISCIPLINE_EMOJI[d] || '⚡'} {d.charAt(0).toUpperCase() + d.slice(1)}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Biometrics */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionLabel>Biométricos · Garmin Live</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {biometrics.map((b) => (
            <div key={b.label} style={{ background: COLORS.surface, borderRadius: '1.25rem', padding: '1rem' }}>
              <p style={{ fontSize: '0.65rem', color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{b.label}</p>
              <p style={{ fontSize: '1.75rem', fontWeight: '900', color: b.color, lineHeight: 1 }}>{b.value}</p>
              <p style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '2px' }}>{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* API Connection Center */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionLabel>Centro de Sincronización</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {APIS_METADATA.map((apiMeta) => (
            <ApiCard key={apiMeta.id} apiMeta={apiMeta} status={connections[apiMeta.id]} onAction={handleApiAction} />
          ))}
        </div>
      </section>

      {/* Inteligencia Técnica Alpha — Protocolos RAG */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionLabel>🧠 Inteligencia Técnica Alpha · Protocolos RAG</SectionLabel>
        <div style={{ background: COLORS.surface, borderRadius: '1.25rem', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8rem', color: COLORS.textSoft, lineHeight: 1.5, marginBottom: '1rem' }}>
            Los protocolos son la base de conocimiento que el Orquestador consulta (RAG) antes de generar cada plan.
            Contiene 17 protocolos: Atletismo, Running, Trail, Ruta, MTB, Pesas, Natación, AMPK/mTOR.
          </p>
          <button
            onClick={handleSeedProtocols}
            disabled={seedingProtocols}
            style={{
              width: '100%', padding: '0.875rem', borderRadius: '1rem',
              background: `${COLORS.primary}15`, border: `1px solid ${COLORS.primary}`,
              color: seedingProtocols ? COLORS.textMuted : COLORS.primary,
              fontWeight: '800', fontSize: '0.82rem', cursor: seedingProtocols ? 'not-allowed' : 'pointer',
              opacity: seedingProtocols ? 0.6 : 1, fontFamily: "'Inter', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {seedingProtocols ? '⏳ Cargando protocolos...' : '📚 Cargar / Actualizar Protocolos Alpha v3.0'}
          </button>
        </div>
      </section>

      {/* Equipment Arsenal */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionLabel>Arsenal de Equipo</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {GEAR_ITEMS.filter((g) =>
            (g.id === 'tarmac' && resources.includes('bike_road')) ||
            (g.id === 'epic'   && resources.includes('bike_mtb')) ||
            (g.id === 'gym'    && resources.includes('gym')) ||
            (g.id === 'pool'   && resources.includes('pool')) ||
            resources.length === 0
          ).map((g) => <GearCard key={g.id} gear={g} />)}
        </div>
      </section>

      {/* Settings Toggles */}
      <section style={{ background: COLORS.surface, borderRadius: '1.5rem', padding: '0 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ paddingTop: '0.5rem' }}>
          <Toggle label="Privacidad"       desc="Encriptar datos biométricos localmente"     value={settings.privacy}       onChange={toggleSetting('privacy')} />
          <Toggle label="Automatización"   desc="Importar datos de Strava automáticamente"   value={settings.automation}    onChange={toggleSetting('automation')} />
          <Toggle label="Notificaciones"   desc="Alertas de sobreentrenamiento y check-ins"  value={settings.notifications} onChange={toggleSetting('notifications')} />
        </div>
      </section>

      {/* Privacy Note */}
      <section style={{ background: `rgba(46,91,255,0.06)`, borderRadius: '1.5rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', borderLeft: `3px solid ${COLORS.secondary}` }}>
        <p style={{ fontSize: '0.7rem', color: COLORS.secondary, fontWeight: '800', marginBottom: '0.3rem' }}>🔒 REGLA DE PRIVACIDAD · R6</p>
        <p style={{ fontSize: '0.8rem', color: COLORS.textSoft, lineHeight: 1.5 }}>
          Tus datos de salud, HRV, ubicación y carga biométrica son de tu propiedad exclusiva. CoreAdapt no comparte ni vende información personal bajo ninguna circunstancia.
        </p>
      </section>

      {/* Developer Settings */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div onClick={() => setShowDevSettings(!showDevSettings)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.65rem', color: COLORS.border, fontWeight: '800' }}>
            {showDevSettings ? '▼ OCULTAR DEVELOPER TOOLS' : '▶ MOSTRAR DEVELOPER TOOLS'}
          </p>
        </div>
        {showDevSettings && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '1.25rem', background: `rgba(255,191,0,0.05)`, border: `1px dashed ${COLORS.warning}` }}>
            <button onClick={simulateSync} style={{ width: '100%', padding: '1rem', borderRadius: '1rem', background: `linear-gradient(135deg, ${COLORS.warning} 0%, #FF4444 100%)`, border: 'none', color: COLORS.primaryDark, fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1rem' }}>
              ⚡ SIMULAR SINCRONIZACIÓN (FATIGA)
            </button>
            <button
              onClick={handleSeedProtocols}
              disabled={seedingProtocols}
              style={{ width: '100%', padding: '1rem', borderRadius: '1rem', background: COLORS.surface, border: `1px solid ${COLORS.primary}`, color: seedingProtocols ? COLORS.textMuted : COLORS.primary, fontWeight: '800', fontSize: '0.85rem', cursor: seedingProtocols ? 'not-allowed' : 'pointer', opacity: seedingProtocols ? 0.6 : 1 }}
            >
              {seedingProtocols ? '⏳ CARGANDO PROTOCOLOS...' : '📚 CARGAR PROTOCOLOS MAESTROS ALPHA v3.0'}
            </button>
          </div>
        )}
      </section>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1rem' }}>
        <button onClick={handleReset} style={{ width: '100%', padding: '0.9rem', borderRadius: '9999px', background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          ↺ Reiniciar Configuración
        </button>
      </div>

      {/* Version Footer */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: COLORS.border, fontSize: '0.7rem', marginBottom: '1rem' }}>CoreAdapt Engine v3.0.0 (Personal)</p>
        <button
          onClick={async () => {
            if (window.confirm('¿Forzar actualización? Esto limpiará la caché local y recargará la aplicación.')) {
              if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const r of registrations) await r.unregister();
              }
              if ('caches' in window) {
                const names = await caches.keys();
                for (const name of names) await caches.delete(name);
              }
              window.location.reload(true);
            }
          }}
          style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, padding: '0.4rem 1rem', borderRadius: '9999px', color: COLORS.textMuted, fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}
        >
          🔄 FORZAR ACTUALIZACIÓN (LIMPIAR CACHÉ)
        </button>
      </div>
    </div>
  );
};

export default Cockpit;
