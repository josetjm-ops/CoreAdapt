export const GOOGLE_SHEETS_WEBHOOK =
  'https://script.google.com/macros/s/AKfycbwUILJYG_mCAZoGzIVNj0n3A72jjOO_qVUbFg8UCkKz9TaneaUzYAf757hAxWb9IR8/exec';

export const BRAIN_API = '/api/brain';

export const postToSheets = (payload) =>
  fetch(GOOGLE_SHEETS_WEBHOOK, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => console.error('Error sincronizando con Google Sheets:', err));
