import { randomBytes, createHash } from 'node:crypto';
import { database } from './visitorStore.js';
import { RATE_LIMITS } from '../src/shared/rateLimits.js';

export class RateLimitError extends Error {
  constructor(retryAfterSeconds, message = 'Too many requests. Please wait a moment and try again.') {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// Uploads are infrequent and costly. A single owner-scoped document gives a
// consistent quota across Vercel instances without a new service.
export async function consumeUploadQuota(uid, kind, at = Date.now()) {
  const policy = ['audio', 'click'].includes(kind) ? RATE_LIMITS.audioUploads : RATE_LIMITS.imageUploads;
  const category = ['audio', 'click'].includes(kind) ? 'audio' : 'image';
  const ref = database().collection('uploadQuotas').doc(`${uid}_${category}`);
  await database().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    const data = snapshot.data() || {};
    const start = Number(data.windowStart) || 0;
    const current = at - start < policy.windowMs ? Number(data.count) || 0 : 0;
    if (current >= policy.max) {
      throw new RateLimitError(Math.max(1, Math.ceil((start + policy.windowMs - at) / 1000)),
        `Upload limit reached. Try again in a few minutes.`);
    }
    tx.set(ref, { windowStart: current ? start : at, count: current + 1 });
  });
}

// This protects a single server instance from bursts. It is deliberately
// generous and is not a distributed quota for anonymous traffic.
const processSalt = randomBytes(16).toString('hex');
const anonymousBuckets = new Map();
function checkAnonymousBurst(request, policyName, at = Date.now()) {
  const address = String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const key = `${policyName}:${createHash('sha256').update(processSalt).update(address).digest('hex')}`;
  const policy = RATE_LIMITS[policyName];
  const bucket = anonymousBuckets.get(key);
  const current = bucket && at - bucket.start < policy.windowMs ? bucket : { start: at, count: 0 };
  if (current.count >= policy.max) throw new RateLimitError(Math.max(1, Math.ceil((current.start + policy.windowMs - at) / 1000)));
  current.count += 1;
  anonymousBuckets.set(key, current);
  if (anonymousBuckets.size > 5000) {
    for (const [candidate, value] of anonymousBuckets) if (at - value.start >= policy.windowMs) anonymousBuckets.delete(candidate);
  }
}

export function checkPublicAnalyticsBurst(request, at = Date.now()) {
  return checkAnonymousBurst(request, 'publicAnalytics', at);
}

export function checkPublicProfileEventBurst(request, at = Date.now()) {
  return checkAnonymousBurst(request, 'publicProfileEvents', at);
}

export function checkSignupBurst(request, at = Date.now()) {
  return checkAnonymousBurst(request, 'signup', at);
}
