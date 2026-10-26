import { database } from '../server/visitorStore.js';
import { recordProfileEventAggregate } from '../server/profileEventAggregate.js';
import { checkPublicProfileEventBurst, RateLimitError } from '../server/rateLimit.js';
import { sameOrigin } from '../server/visitorSecurity.js';

const bodyOf = (request) => typeof request.body === 'object' && request.body !== null
  ? request.body
  : JSON.parse(request.body || '{}');

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  if (!sameOrigin(request)) return response.status(403).json({ error: 'Invalid origin.' });
  if (Number(request.headers?.['content-length'] || 0) > 2048) return response.status(413).json({ error: 'Request is too large.' });
  try {
    checkPublicProfileEventBurst(request);
    const result = await recordProfileEventAggregate(database(), bodyOf(request));
    return response.status(200).json({ recorded: result.recorded });
  } catch (error) {
    if (error instanceof RateLimitError) {
      response.setHeader('Retry-After', String(error.retryAfterSeconds));
      return response.status(429).json({ error: error.message });
    }
    if (/Invalid|not found/i.test(error?.message || '')) return response.status(400).json({ error: error.message });
    console.error('Profile event failed:', error);
    return response.status(503).json({ error: 'Profile activity is temporarily unavailable.' });
  }
}
