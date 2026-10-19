import { timingSafeEqual } from 'node:crypto';
import { bearerToken, verifyFirebaseToken } from './firebaseAuth.js';
import { database, expiry, hash, now } from './visitorStore.js';

export function sameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host === request.headers.host; } catch { return false; }
}

export async function founder(request) {
  return verifyFirebaseToken(bearerToken(request));
}

export function botActor(request) {
  const configured = process.env.VISITOR_BOT_SECRET || '';
  const sent = String(request.headers['x-visitor-bot-secret'] || '');
  const actor = String(request.headers['x-discord-admin-id'] || '');
  const allow = new Set((process.env.DISCORD_ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean));
  if (!configured || !sent || !allow.has(actor)) return null;
  const a = Buffer.from(configured), b = Buffer.from(sent);
  return a.length === b.length && timingSafeEqual(a, b) ? actor : null;
}

export async function limit(key, capacity, windowMs) {
  const ref = database().collection('visitorRateLimits').doc(hash(`${process.env.VISITOR_RATE_SALT || 'rate'}:${key}`));
  return database().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const old = snap.data();
    const reset = !old || old.until.toMillis() <= Date.now();
    const count = reset ? 0 : old.count;
    if (count >= capacity) {
      tx.set(ref, { count, blocked: Math.min(10000, (old.blocked || 0) + 1), until: old.until, expiresAt: expiry(windowMs + 86400000), updatedAt: now() });
      return false;
    }
    tx.set(ref, { count: count + 1, blocked: reset ? 0 : old.blocked || 0, until: reset ? expiry(windowMs) : old.until, expiresAt: expiry(windowMs + 86400000), updatedAt: now() });
    return true;
  });
}
