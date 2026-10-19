import { randomBytes, createHash } from 'node:crypto';
import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const id = () => randomBytes(12).toString('hex');
export const hash = (value) => createHash('sha256').update(String(value)).digest('hex');
export const now = () => Timestamp.now();
export const expiry = (ms) => Timestamp.fromMillis(Date.now() + ms);

export function database() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    initializeApp({ credential: raw ? cert(JSON.parse(raw)) : applicationDefault(), projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'upet-c480b' });
  }
  return getFirestore();
}

export const publicVisitor = (data) => {
  if (!data) return null;
  const { id: visitorId, firstAt, lastAt, pageViews, route, country, device, browser, os, source, utm, durationSeconds, conversion, events = [] } = data;
  return { id: visitorId, firstAt: firstAt?.toDate?.().toISOString(), lastAt: lastAt?.toDate?.().toISOString(), pageViews, route, country, device, browser, os, source, utm, durationSeconds, conversion, events };
};

export async function audit(actor, action, visitorId) {
  await database().collection('visitorAudit').add({ actor, action, visitorId: visitorId || '', at: now(), expiresAt: expiry(90 * 86400000) });
}

export async function visitorById(visitorId) {
  if (!/^[a-f0-9]{24}$/.test(visitorId || '')) return null;
  const snap = await database().collection('visitorSessions').doc(visitorId).get();
  return snap.exists ? publicVisitor(snap.data()) : null;
}

export async function diagnosticById(visitorId) {
  const snap = await database().collection('visitorDiagnostics').doc(visitorId).get();
  const value = snap.data();
  return value?.expiresAt?.toMillis() > Date.now() && value.discordId && !value.revoked ? value : null;
}

export async function recentVisitors(limit = 5000) {
  const snap = await database().collection('visitorSessions').where('lastAt', '>=', Timestamp.fromMillis(Date.now() - 7 * 86400000)).orderBy('lastAt', 'desc').limit(Math.min(limit, 5000)).get();
  return snap.docs.map((doc) => publicVisitor(doc.data()));
}
