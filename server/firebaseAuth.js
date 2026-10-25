import { createRemoteJWKSet, jwtVerify } from 'jose';
import { hasTrustedRole } from './v2/authClaims.js';

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'upet-c480b';
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_KEYS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

const recoveryFounderUids = () => new Set(String(process.env.UPET_FOUNDER_RECOVERY_UIDS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean));

export function identityFromFirebasePayload(payload = {}) {
  const uid = String(payload.sub || payload.uid || '');
  const email = String(payload.email || '').trim().toLowerCase();
  if (!uid) throw new Error('Invalid account token.');
  return {
    uid,
    email,
    emailVerified: payload.email_verified === true,
    claims: {
      role: typeof payload.role === 'string' ? payload.role : undefined,
      roles: Array.isArray(payload.roles) ? payload.roles : undefined,
      founder: payload.founder === true,
      admin: payload.admin === true,
      moderator: payload.moderator === true,
      support: payload.support === true,
    },
  };
}

export function canUseFounderRecovery(identity, configuredUids = recoveryFounderUids()) {
  return Boolean(identity?.uid && configuredUids.has(identity.uid));
}

export async function verifyFirebaseIdentity(token) {
  if (!token) throw new Error('Sign in before managing files.');

  const { payload } = await jwtVerify(token, FIREBASE_KEYS, {
    algorithms: ['RS256'],
    audience: FIREBASE_PROJECT_ID,
    issuer: FIREBASE_ISSUER,
  });

  return identityFromFirebasePayload(payload);
}

export async function verifyFirebaseToken(token) {
  const account = await verifyFirebaseIdentity(token);
  if (!hasTrustedRole(account, 'founder') && !canUseFounderRecovery(account)) {
    throw new Error('This account cannot manage profile files.');
  }
  return account;
}

export function bearerToken(request) {
  const header = typeof request.headers?.get === 'function'
    ? request.headers.get('authorization') || ''
    : request.headers?.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}
