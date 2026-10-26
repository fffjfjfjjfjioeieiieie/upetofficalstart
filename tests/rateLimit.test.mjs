import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPublicAnalyticsBurst, RateLimitError } from '../server/rateLimit.js';
import { RATE_LIMITS } from '../src/shared/rateLimits.js';

test('ordinary analytics requests pass, bursts return a short retry window', () => {
  const request = { headers: { 'x-forwarded-for': '192.0.2.42' } };
  const start = Date.now();
  for (let index = 0; index < RATE_LIMITS.publicAnalytics.max; index += 1) {
    assert.doesNotThrow(() => checkPublicAnalyticsBurst(request, start));
  }
  assert.throws(() => checkPublicAnalyticsBurst(request, start), (error) =>
    error instanceof RateLimitError && error.retryAfterSeconds > 0);
  assert.doesNotThrow(() => checkPublicAnalyticsBurst(request, start + RATE_LIMITS.publicAnalytics.windowMs));
});
