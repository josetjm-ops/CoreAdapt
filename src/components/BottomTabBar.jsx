import React from 'react';
import { useTranslation } from 'react-i18next';

const NAV_ICONS = {
  hoy: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  miPlan: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  combustible: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  cockpit: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  ),
};

const BottomTabBar = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'hoy',         label: t('tabs.hoy') },
    { id: 'miPlan',      label: t('tabs.miPlan') },
    { id: 'combustible', label: t('tabs.combustible') },
    { id: 'cockpit',     label: t('tabs.cockpit') },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: '20px',
      left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: '440px',
      height: '68px',
      background: 'rgba(32,31,31,0.85)',
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      borderRadius: '9999px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      zIndex: 1000,
      border: '1px solid rgba(59,75,55,0.3)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {tabs.map((tab, i) => {
        const active = activeTab === tab.id;
        // Camera FAB sits between miPlan and combustible (index 1 and 2)
        const showFab = i === 1;
        return (
          <React.Fragment key={tab.id}>
            <button
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                color: active ? '#00FF41' : '#84967e',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                padding: '0 4px',
                transition: 'color 0.2s',
                minWidth: '48px',
              }}
            >
              <span style={{ filter: active ? 'drop-shadow(0 0 6px #00FF41)' : 'none', transition: 'filter 0.2s' }}>
                {NAV_ICONS[tab.id]}
              </span>
              <span style={{ fontSize: '0.55rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                {tab.label}
              </span>
            </button>

            {/* FAB Camera between index 1 and 2 */}
            {showFab && (
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(180deg, #ebffe2 0%, #00FF41 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px rgba(0,255,65,0.45)',
                cursor: 'pointer',
                marginBottom: '10px',
              }}
              onClick={() => setActiveTab('combustible')}
              title="Capturar Alimento"
              >
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#003907" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default BottomTabBar;
