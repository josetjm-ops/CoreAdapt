import React, { useState, useEffect } from 'react';

/**
 * InstallPrompt Component
 * ──────────────────────────────────────────────────────────────────────────────
 * Handles PWA installation for two distinct platforms:
 *
 *  · Android / Chrome: Intercepts the `beforeinstallprompt` event and shows a
 *    branded banner with an "Install" button that triggers the native prompt.
 *
 *  · iOS / Safari: Detects the Safari browser on iPhone/iPad and shows a manual
 *    instruction panel since Apple does not support programmatic install prompts.
 *
 * The banners are only visible once — hidden after installation or dismissal —
 * and never shown again if the app is already running in standalone mode.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const isIos = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

const isInStandaloneMode = () =>
  'standalone' in window.navigator && window.navigator.standalone;

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa_dismissed') === 'true'
  );

  useEffect(() => {
    // If already installed or previously dismissed, do nothing
    if (isInStandaloneMode() || dismissed) return;

    // ── Android / Chrome ──
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // ── iOS / Safari ──
    if (isIos() && !isInStandaloneMode()) {
      // Small delay so the UI settles first
      setTimeout(() => setShowIosBanner(true), 2500);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowAndroidBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowAndroidBanner(false);
    setShowIosBanner(false);
    localStorage.setItem('pwa_dismissed', 'true');
    setDismissed(true);
  };

  const bannerBase = {
    position: 'fixed',
    bottom: '90px', // above the bottom tab bar
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: '440px',
    background: 'rgba(19, 19, 19, 0.96)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(0, 255, 65, 0.25)',
    borderRadius: '20px',
    padding: '16px 20px',
    zIndex: 9999,
    boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 40px rgba(0,255,65,0.05)',
    fontFamily: "'Inter', sans-serif",
    color: '#e5e2e1',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  return (
    <>
      {/* ── Global animation keyframe ── */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(24px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* ─────────────────── ANDROID / CHROME BANNER ─────────────────── */}
      {showAndroidBanner && (
        <div style={bannerBase}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/icon-192.png" alt="CoreAdapt" style={{ width: '44px', height: '44px', borderRadius: '12px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '800', fontSize: '14px', lineHeight: 1.2 }}>
                Instala CoreAdapt
              </p>
              <p style={{ color: '#84967e', fontSize: '11px', marginTop: '2px' }}>
                Accede como una app nativa, sin el navegador.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              style={{ background: 'none', border: 'none', color: '#84967e', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '4px' }}
            >
              ✕
            </button>
          </div>
          <button
            onClick={handleInstallAndroid}
            style={{
              background: 'linear-gradient(180deg, #ebffe2 0%, #00FF41 100%)',
              color: '#003907', border: 'none', borderRadius: '50px',
              padding: '14px', fontSize: '14px', fontWeight: '800',
              cursor: 'pointer', width: '100%',
            }}
          >
            ⬇ Instalar en mi celular
          </button>
        </div>
      )}

      {/* ─────────────────── iOS / SAFARI BANNER ─────────────────── */}
      {showIosBanner && (
        <div style={bannerBase}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/icon-192.png" alt="CoreAdapt" style={{ width: '44px', height: '44px', borderRadius: '12px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '800', fontSize: '14px', lineHeight: 1.2 }}>
                Instala CoreAdapt en iPhone
              </p>
              <p style={{ color: '#84967e', fontSize: '11px', marginTop: '2px' }}>
                Sigue los pasos para agregar la app a tu pantalla de inicio.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              style={{ background: 'none', border: 'none', color: '#84967e', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '4px' }}
            >
              ✕
            </button>
          </div>

          {/* Step-by-step instructions */}
          {[
            { icon: '1️⃣', text: 'Toca el botón Compartir (□↑) en la barra inferior de Safari.' },
            { icon: '2️⃣', text: 'Desplázate y selecciona "Agregar a pantalla de inicio".' },
            { icon: '3️⃣', text: 'Confirma con "Agregar". ¡Listo! CoreAdapt aparecerá en tu pantalla.' },
          ].map((step) => (
            <div key={step.icon} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{step.icon}</span>
              <p style={{ fontSize: '12px', color: '#b9ccb2', lineHeight: 1.5 }}>{step.text}</p>
            </div>
          ))}

          {/* Arrow pointing to Safari share button */}
          <div style={{
            background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)',
            borderRadius: '12px', padding: '10px 14px', fontSize: '12px', color: '#00FF41',
            fontWeight: '700', textAlign: 'center',
          }}>
            ▼ Busca el ícono de compartir abajo ▼
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPrompt;
