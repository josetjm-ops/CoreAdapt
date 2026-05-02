import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminDb = null;
let adminAuth = null;

try {
  if (!getApps().length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON no configurado en variables de entorno');
    initializeApp({ credential: cert(JSON.parse(sa)) });
  }
  adminDb = getFirestore();
  adminAuth = getAuth();
} catch (e) {
  console.error('[Firebase Admin] Init failed — funciones que requieren Admin SDK responderán 503:', e.message);
}

export { adminDb, adminAuth };
