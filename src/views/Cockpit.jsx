import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connectionService } from '../services/ConnectionService';
import { BrainService } from '../services/BrainService';
import { normalizeGarminData } from '../services/GarminDataNormalizer';
import { seedProtocols } from '../services/ProtocolSeeder';

// ─── Constants ────────────────────────────────────────────────────────────────

const APIS_METADATA = [
  { id: 'garmin', name: 'Garmin Connect', icon: '⌚', detail: 'HRV · Body Battery · Actividades' },
  { id: 'strava', name: 'Strava', icon: '🧡', detail: 'Segmentos · KOMs · Social' },
  { id: 'apple_health', name: 'Apple Health', icon: '🍏', detail: 'Sueño · Pasos · Anillos' },
  { id: 'coros', name: 'COROS', icon: '🏃', detail: 'Métricas de Fatiga · Carga de Entrenamiento' },
  { id: 'alpha_intelligence', name: 'Inteligencia Técnica Alpha', icon: '🧠', detail: 'Base de Conocimiento · Protocolos RAG' },
];

const GEAR_ITEMS = [
  { id: 'tarmac', icon: '🚴', name: 'S-Works Tarmac SL8', type: 'Ciclismo de Ruta', stat: '4,280 km', statLabel: 'Acumulado' },
  { id: 'epic', icon: '🚵', name: 'Specialized Epic', type: 'MTB', stat: '1,640 km', statLabel: 'Acumulado' },
  { id: 'gym', icon: '🏋️', name: 'Performance Center', type: 'Gimnasio', stat: '3x / sem', statLabel: 'Frecuencia' },
  { id: 'pool', icon: '🏊', name: 'Olympic Pool Pro', type: 'Natación', stat: '2x / sem', statLabel: 'Frecuencia' },
];

const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

const BIOMETRICS = [
  { label: 'HRV', value: '58 ms', sub: '+4 vs ayer', color: '#00FF41' },
  { label: 'VO₂ Max', value: '64', sub: 'ml/kg/min', color: '#2E5BFF' },
  { label: 'FC Reposo', value: '42', sub: 'bpm', color: '#b9ccb2' },
  { label: 'Body Battery', value: '82', sub: '/ 100', color: '#00FF41' },
];

const AVATAR_LABELS = { executive: '💼 Ejecutivo', university: '🎓 Universitario' };
const DISCIPLINE_ICONS = { running: '🏃', trail: '⛰️', ciclismo: '🚴', mtb: '🚵', pesas: '🏋️', natacion: '🏊' };

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <p style={{
    fontSize: '0.65rem', color: '#84967e', fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: '0.12em',
    marginBottom: '0.75rem', marginTop: '0.25rem',
  }}>{children}</p>
);

const Toggle = ({ label, desc, value, onChange }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 0', borderBottom: '1px solid #1c1b1b',
  }}>
    <div style={{ flex: 1, paddingRight: '1rem' }}>
      <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{label}</p>
      <p style={{ color: '#84967e', fontSize: '0.75rem', marginTop: '2px' }}>{desc}</p>
    </div>
    <div
      onClick={() => onChange(!value)}
      style={{
        width: '48px', height: '26px', borderRadius: '13px', flexShrink: 0,
        background: value ? '#00FF41' : '#2a2a2a',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.25s',
        boxShadow: value ? '0 0 12px rgba(0,255,65,0.4)' : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '25px' : '3px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: value ? '#003907' : '#84967e',
        transition: 'left 0.25s',
      }} />
    </div>
  </div>
);

const ApiCard = ({ apiMeta, status, onAction, t }) => {
  const isConnected = status?.connected;
  const isSyncing = status?.connected && !status?.lastSync;
  
  const statusColor = isConnected ? '#00FF41' : '#84967e';
  const statusLabel = isConnected ? t('cockpit.connected') : t('cockpit.disconnected');

  return (
    <div style={{
      background: '#1c1b1b', borderRadius: '1.25rem', padding: '1rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '0.75rem', flexShrink: 0,
        background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem',
      }}>{apiMeta.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{apiMeta.name}</p>
          <span style={{
            fontSize: '0.6rem', fontWeight: '700', color: statusColor,
            background: `${statusColor}15`, borderRadius: '9999px', padding: '2px 8px', flexShrink: 0,
          }}>{statusLabel}</span>
        </div>
        <p style={{ color: '#84967e', fontSize: '0.75rem', marginTop: '2px' }}>{apiMeta.detail}</p>
        {status?.lastSync && (
          <p style={{ color: '#3b4b37', fontSize: '0.65rem', marginTop: '2px', textTransform: 'uppercase' }}>
            {t('cockpit.sync_msg')} {new Date(status.lastSync).toLocaleTimeString()}
          </p>
        )}
      </div>
      <button 
        onClick={() => onAction(apiMeta.id, isConnected)}
        style={{
          background: isConnected ? '#2a2a2a' : 'linear-gradient(180deg, #ebffe2 0%, #00FF41 100%)',
          border: 'none',
          padding: '0.5rem 0.75rem',
          borderRadius: '9999px',
          color: isConnected ? '#e5e2e1' : '#003907',
          fontWeight: '700',
          fontSize: '0.7rem',
          cursor: 'pointer',
          minWidth: '80px',
          fontFamily: 'inherit'
        }}
      >
        {isConnected ? t('cockpit.btn_disconnect') : t('cockpit.btn_connect')}
      </button>
    </div>
  );
};

const GearCard = ({ gear }) => (
  <div style={{
    background: '#1c1b1b', borderRadius: '1.25rem', padding: '1rem',
    display: 'flex', alignItems: 'center', gap: '1rem',
  }}>
    <div style={{
      width: '48px', height: '48px', borderRadius: '0.75rem', flexShrink: 0,
      background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.5rem',
    }}>{gear.icon}</div>
    <div style={{ flex: 1 }}>
      <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{gear.name}</p>
      <p style={{ color: '#84967e', fontSize: '0.75rem' }}>{gear.type}</p>
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <p style={{ fontWeight: '800', fontSize: '1rem', color: '#00FF41' }}>{gear.stat}</p>
      <p style={{ color: '#84967e', fontSize: '0.6rem' }}>{gear.statLabel}</p>
    </div>
  </div>
);

// ─── Main Cockpit Component ───────────────────────────────────────────────────

const Cockpit = ({ profile = {}, setProfile }) => {
  const { t, i18n } = useTranslation();
  const [connections, setConnections] = useState(connectionService.getAllStatus());
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [settings, setSettings] = useState({
    privacy: true,
    automation: true,
    notifications: true,
  });

  const handleApiAction = async (serviceId, isConnected) => {
    if (isConnected) {
      connectionService.disconnect(serviceId);
      setConnections(connectionService.getAllStatus());
    } else {
      // Simulate connecting process with a "Syncing" transitory state
      await connectionService.connect(serviceId);
      setConnections(connectionService.getAllStatus());
    }
  };

  const toggleSetting = (key) => (val) => setSettings(s => ({ ...s, [key]: val }));

  const handleReset = () => {
    if (window.confirm('¿Reiniciar el Onboarding? Se perderá la configuración actual.')) {
      localStorage.removeItem('coreAdaptProfile');
      window.location.reload();
    }
  };

  const simulateSync = async () => {
    const rawGarmin = { hrv: 40, bodyBattery: 35, restingHR: 48 };
    const history = [{ hrv: 58 }, { hrv: 60 }, { hrv: 55 }, { hrv: 62 }]; // Mock history for trend
    
    const normalized = normalizeGarminData(rawGarmin, history);
    console.log("Simulated Biometrics:", normalized);

    const biometria = { 
      hrv: normalized.hrv, 
      body_battery: normalized.body_battery, 
      fc_reposo: normalized.fc_reposo 
    };
    
    const objetivo = { meta_nombre: profile.milestone, dias_restantes: 30 };
    const actividad = { cumplimiento_bool: false, rpe_usuario: 9, tss_carga: 150 };

    alert("Simulando Sincronización... HRV Bajo (40ms) detectado.");
    
    const result = await BrainService.getAthleteInsight(profile, biometria, actividad, objetivo);
    console.log("AI Feedback:", result);
    
    if (result.alerta_sobreentreno) {
      alert("⚠️ CEREBRO: Alerta de sobreentrenamiento activada.");
    }
  };

  const handleSeedProtocols = async () => {
    const ok = await seedProtocols();
    if (ok) alert("Protocolos Maestros Alpha cargados correctamente en Conocimiento_Tecnico.");
  };

  const disciplines = profile.disciplines || [];
  const resources = profile.resources || [];

  return (
    <div style={{
      padding: '2rem 1.5rem 9rem',
      fontFamily: "'Inter', sans-serif",
      color: '#e5e2e1',
      maxWidth: '480px',
      margin: '0 auto',
    }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#b9ccb2', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('cockpit.subtitle')}
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', marginTop: '0.1rem' }}>
          {t('cockpit.title')}
        </h1>
      </header>

      {/* ── Athlete Profile Card ── */}
      <section style={{
        background: '#1c1b1b', borderRadius: '1.5rem', padding: '1.5rem',
        marginBottom: '1.5rem', borderTop: '2px solid #2E5BFF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #2E5BFF22 0%, #00FF4122 100%)',
            border: '2px solid #2E5BFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>
            {profile.avatar === 'executive' ? '💼' : '🎓'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>
              {AVATAR_LABELS[profile.avatar] || '🏃 Atleta CoreAdapt'}
            </p>
            <p style={{ color: '#b9ccb2', fontSize: '0.8rem', marginTop: '2px' }}>
              {profile.milestone || 'Hito no configurado'}
            </p>
            {profile.milestoneDate && (
              <p style={{ color: '#2E5BFF', fontSize: '0.72rem', fontWeight: '700', marginTop: '2px' }}>
                📅 {new Date(profile.milestoneDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Active Disciplines */}
        {disciplines.length > 0 && (
          <div>
            <p style={{ fontSize: '0.65rem', color: '#84967e', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Disciplinas Activas
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {disciplines.map(d => (
                <span key={d} style={{
                  background: '#2a2a2a', borderRadius: '9999px',
                  padding: '4px 12px', fontSize: '0.75rem', fontWeight: '600',
                }}>
                  {DISCIPLINE_ICONS[d] || '⚡'} {d.charAt(0).toUpperCase() + d.slice(1)}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Biometrics ── */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionLabel>{t('cockpit.biometrics')} · Garmin Live</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {BIOMETRICS.map(b => (
            <div key={b.label} style={{
              background: '#1c1b1b', borderRadius: '1.25rem', padding: '1rem',
            }}>
              <p style={{ fontSize: '0.65rem', color: '#84967e', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                {b.label}
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: '900', color: b.color, lineHeight: 1 }}>{b.value}</p>
              <p style={{ fontSize: '0.7rem', color: '#84967e', marginTop: '2px' }}>{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── API Connection Center ── */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionLabel>{t('cockpit.syncCenter')}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {APIS_METADATA.map(apiMeta => (
            <ApiCard 
              key={apiMeta.id} 
              apiMeta={apiMeta} 
              status={connections[apiMeta.id]} 
              onAction={handleApiAction} 
              t={t} 
            />
          ))}
        </div>
      </section>

      {/* ── Equipment Arsenal ── */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionLabel>{t('cockpit.gear')}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {GEAR_ITEMS.filter(g =>
            (g.id === 'tarmac' && resources.includes('bike_road')) ||
            (g.id === 'epic' && resources.includes('bike_mtb')) ||
            (g.id === 'gym' && resources.includes('gym')) ||
            (g.id === 'pool' && resources.includes('pool')) ||
            resources.length === 0 // show all if no resources selected
          ).map(g => <GearCard key={g.id} gear={g} />)}
        </div>
      </section>

      {/* ── Language Switcher ── */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionLabel>{t('cockpit.language')}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          {LANGUAGES.map(lang => {
            const active = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                style={{
                  background: active ? '#00FF41' : '#1c1b1b',
                  color: active ? '#003907' : '#e5e2e1',
                  border: active ? 'none' : '1px solid #2a2a2a',
                  borderRadius: '1rem', padding: '0.75rem',
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  fontWeight: '700', fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  boxShadow: active ? '0 0 16px rgba(0,255,65,0.3)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
                {lang.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Settings Toggles ── */}
      <section style={{
        background: '#1c1b1b', borderRadius: '1.5rem', padding: '0 1.25rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ paddingTop: '0.5rem' }}>
          <Toggle
            label={t('cockpit.privacy')}
            desc={t('cockpit.privacyDesc')}
            value={settings.privacy}
            onChange={toggleSetting('privacy')}
          />
          <Toggle
            label={t('cockpit.automation')}
            desc={t('cockpit.automationDesc')}
            value={settings.automation}
            onChange={toggleSetting('automation')}
          />
          <Toggle
            label={t('cockpit.notifications')}
            desc={t('cockpit.notificationsDesc')}
            value={settings.notifications}
            onChange={toggleSetting('notifications')}
          />
        </div>
      </section>

      {/* ── Privacy Note (Regla R6) ── */}
      <section style={{
        background: 'rgba(46,91,255,0.06)', borderRadius: '1.5rem',
        padding: '1rem 1.25rem', marginBottom: '1.5rem',
        borderLeft: '3px solid #2E5BFF',
      }}>
        <p style={{ fontSize: '0.7rem', color: '#2E5BFF', fontWeight: '800', marginBottom: '0.3rem' }}>
          🔒 REGLA DE PRIVACIDAD · R6
        </p>
        <p style={{ fontSize: '0.8rem', color: '#b9ccb2', lineHeight: 1.5 }}>
          Tus datos de salud, HRV, ubicación y carga biométrica son de tu propiedad exclusiva.
          CoreAdapt no comparte ni vende información personal bajo ninguna circunstancia.
        </p>
      </section>

      {/* ── Developer Settings (Hidden by default) ── */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div 
          onClick={() => setShowDevSettings(!showDevSettings)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
        >
          <p style={{ fontSize: '0.65rem', color: '#3b4b37', fontWeight: '800' }}>
            {showDevSettings ? '▼ OCULTAR DEVELOPER TOOLS' : '▶ MOSTRAR DEVELOPER TOOLS'}
          </p>
        </div>
        
        {showDevSettings && (
          <div style={{
            marginTop: '1rem', padding: '1rem', borderRadius: '1.25rem',
            background: 'rgba(255,191,0,0.05)', border: '1px dashed #FFBF00'
          }}>
            <button
              onClick={simulateSync}
              style={{
                width: '100%', padding: '1rem', borderRadius: '1rem',
                background: 'linear-gradient(135deg, #FFBF00 0%, #FF4444 100%)',
                border: 'none', color: '#003907', fontWeight: '800',
                fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1rem'
              }}
            >
              ⚡ SIMULAR SINCRONIZACIÓN (FATIGA)
            </button>
            
            <button
              onClick={handleSeedProtocols}
              style={{
                width: '100%', padding: '1rem', borderRadius: '1rem',
                background: '#1c1b1b', border: '1px solid #00FF41',
                color: '#00FF41', fontWeight: '800',
                fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              📚 CARGAR PROTOCOLOS MAESTROS ALPHA
            </button>
          </div>
        )}
      </section>

      {/* ── Settings Controls ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1rem' }}>
        <button
          onClick={handleReset}
          style={{
            width: '100%', padding: '0.9rem', borderRadius: '9999px',
            background: 'transparent', border: '1px solid #3b4b37',
            color: '#84967e', fontWeight: '700', fontSize: '0.85rem',
            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          }}
        >
          ↺ {t('cockpit.reset')}
        </button>

        <button
          onClick={async () => {
            const { auth } = await import('../firebaseConfig');
            await auth.signOut();
            localStorage.clear();
            window.location.reload();
          }}
          style={{
            width: '100%', padding: '0.9rem', borderRadius: '9999px',
            background: 'rgba(255, 75, 75, 0.1)', border: '1px solid #ff4b4b',
            color: '#ff4b4b', fontWeight: '700', fontSize: '0.85rem',
            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          }}
        >
          LOGOUT (CERRAR SESIÓN)
        </button>
      </div>

      {/* ── Version Footer ── */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: '#3b4b37', fontSize: '0.7rem', marginBottom: '1rem' }}>
          CoreAdapt Engine v2.6.7 (Stable-PROD)
        </p>
        <button
          onClick={async () => {
            if (window.confirm("¿Forzar actualización? Esto limpiará la caché local y recargará la aplicación.")) {
              // 1. Unregister all service workers
              if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                  await registration.unregister();
                }
              }
              // 2. Delete all caches
              if ('caches' in window) {
                const names = await caches.keys();
                for (let name of names) {
                  await caches.delete(name);
                }
              }
              // 3. Force reload
              window.location.reload(true);
            }
          }}
          style={{
            background: 'transparent', border: '1px solid #3b4b37',
            padding: '0.4rem 1rem', borderRadius: '9999px',
            color: '#84967e', fontSize: '0.65rem', fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          🔄 FORZAR ACTUALIZACIÓN (LIMPIAR CACHÉ)
        </button>
      </div>

    </div>
  );
};

export default Cockpit;
