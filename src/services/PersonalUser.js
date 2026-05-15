/**
 * PersonalUser — Reemplaza Firebase Auth para uso personal.
 *
 * Genera un UID único la primera vez que se abre la app y lo persiste
 * en localStorage. Este UID se usa para todas las queries de Firestore.
 *
 * No hay login, no hay registro, no hay verificación de email.
 * Solo tu UID personal, siempre disponible.
 */

const STORAGE_KEY_UID = 'coreadapt_personal_uid';
const STORAGE_KEY_PROFILE = 'coreAdaptProfile';

function generateUID() {
  // Genera un UID compatible con formato Firebase (28 chars alfanuméricos)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let uid = '';
  for (let i = 0; i < 28; i++) {
    uid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uid;
}

/**
 * Obtiene o crea el UID personal.
 * @returns {string} El UID del usuario personal.
 */
export function getPersonalUID() {
  let uid = localStorage.getItem(STORAGE_KEY_UID);
  if (!uid) {
    uid = generateUID();
    localStorage.setItem(STORAGE_KEY_UID, uid);
  }
  return uid;
}

/**
 * Obtiene el perfil del usuario desde localStorage.
 * @returns {Object|null}
 */
export function getProfile() {
  const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
  return saved ? JSON.parse(saved) : null;
}

/**
 * Guarda el perfil del usuario en localStorage.
 * @param {Object} profile
 */
export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
}

/**
 * Resetea toda la configuración personal (para reconfigurar).
 */
export function resetProfile() {
  localStorage.removeItem(STORAGE_KEY_PROFILE);
  // No eliminamos el UID — los datos de Firestore se mantienen vinculados
}

export const personalUser = {
  get uid() { return getPersonalUID(); },
  get profile() { return getProfile(); },
  saveProfile,
  resetProfile,
  getPersonalUID,
};
