// ─── Design Tokens ────────────────────────────────────────────────────────────

export const COLORS = {
  primary: '#00FF41',
  secondary: '#2E5BFF',
  warning: '#FFBF00',
  danger: '#ff4b4b',
  strava: '#FC4C02',
  coros: '#e51e25',

  bg: '#131313',
  bgDeep: '#0a0a0a',
  bgInput: '#0e0e0e',
  surface: '#1c1b1b',
  surfaceHigh: '#2a2a2a',

  text: '#e5e2e1',
  textMuted: '#84967e',
  textSoft: '#b9ccb2',

  border: '#3b4b37',
  borderDark: '#1c1b1b',

  primaryDark: '#003907',
};

// ─── Shared Inline Styles ─────────────────────────────────────────────────────

export const INPUT_STYLE = {
  width: '100%',
  backgroundColor: COLORS.bgInput,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '18px',
  color: '#fff',
  outline: 'none',
  fontSize: '16px',
};

export const LABEL_STYLE = {
  fontSize: '10px',
  color: COLORS.textMuted,
  position: 'absolute',
  top: '-8px',
  left: '16px',
  background: COLORS.bg,
  padding: '0 4px',
  textTransform: 'uppercase',
  fontWeight: 600,
  zIndex: 1,
};

export const BTN_PRIMARY_STYLE = {
  background: `linear-gradient(180deg, #ebffe2 0%, ${COLORS.primary} 100%)`,
  color: COLORS.primaryDark,
  border: 'none',
  borderRadius: '50px',
  padding: '20px',
  fontSize: '16px',
  fontWeight: '800',
  cursor: 'pointer',
  marginTop: '16px',
  width: '100%',
  textTransform: 'uppercase',
};

export const BTN_PRIMARY_DISABLED_STYLE = {
  ...BTN_PRIMARY_STYLE,
  background: '#353534',
  color: COLORS.textMuted,
  cursor: 'not-allowed',
};

export const CARD_STYLE = {
  background: COLORS.surface,
  borderRadius: '1.5rem',
  padding: '1.25rem',
  cursor: 'pointer',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  border: '2px solid transparent',
};

export const CARD_SELECTED_STYLE = {
  ...CARD_STYLE,
  borderColor: COLORS.primary,
  boxShadow: '0 0 20px rgba(0,255,65,0.12)',
};

export const FADE_IN_KEYFRAMES = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;
