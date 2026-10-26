import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const now = () => Timestamp.now();
export const expiry = (ms) => Timestamp.fromMillis(Date.now() + ms);

export function database() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    initializeApp({ credential: raw ? cert(JSON.parse(raw)) : applicationDefault(), projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'upet-c480b' });
  }
  return getFirestore();
}

