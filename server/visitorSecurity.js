import { bearerToken, verifyFirebaseToken } from './firebaseAuth.js';

export function sameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host === request.headers.host; } catch { return false; }
}

export async function founder(request) {
  return verifyFirebaseToken(bearerToken(request));
}

