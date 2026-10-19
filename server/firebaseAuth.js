import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'upet-c480b';
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_KEYS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

const FOUNDER_EMAILS = new Set([
  'zurihcs@gmail.com',
  'lampjustlamp123@gmail.com',
  'iamjayvonlol@gmail.com',
  'riotsoffical@proton.me',
  'daalt38@gmail.com',
]);

export async function verifyFirebaseToken(token) {
  if (!token) throw new Error('Sign in before managing files.');

  const { payload } = await jwtVerify(token, FIREBASE_KEYS, {
    algorithms: ['RS256'],
    audience: FIREBASE_PROJECT_ID,
    issuer: FIREBASE_ISSUER,
  });

  const uid = String(payload.sub || '');
  const email = String(payload.email || '').trim().toLowerCase();
  if (!uid || !FOUNDER_EMAILS.has(email)) throw new Error('This account cannot manage profile files.');

  return { uid, email };
}

export function bearerToken(request) {
  const header = typeof request.headers?.get === 'function'
    ? request.headers.get('authorization') || ''
    : request.headers?.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}
