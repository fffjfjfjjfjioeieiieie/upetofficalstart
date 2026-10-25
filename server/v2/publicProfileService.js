import { publicProfileProjectionV2Schema } from '../../src/shared/contracts/publicProfileV2.js';
import { PROFILE_V2_COLLECTIONS } from './firestoreProfileRepository.js';
import { createPublicRequestCache } from './publicRequestCache.js';

const cache = createPublicRequestCache();
const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,19}$/;

export class PublicProfileNotFoundError extends Error {
  constructor(username) {
    super(`Public profile ${username} was not found.`);
    this.name = 'PublicProfileNotFoundError';
    this.code = 'public_profile_not_found';
  }
}

export function normalizePublicUsername(value) {
  const username = String(value || '').trim().toLowerCase();
  if (!usernamePattern.test(username)) throw new Error('Invalid username.');
  return username;
}

export async function loadPublicProfileV2(db, username) {
  const normalized = normalizePublicUsername(username);
  return cache.get(normalized, async () => {
    const snapshot = await db.collection(PROFILE_V2_COLLECTIONS.public).doc(normalized).get();
    if (!snapshot.exists) throw new PublicProfileNotFoundError(normalized);
    return publicProfileProjectionV2Schema.parse(snapshot.data());
  });
}

export function invalidatePublicProfileV2(username) {
  cache.invalidate(normalizePublicUsername(username));
}

export function clearPublicProfileV2Cache() {
  cache.clear();
}
