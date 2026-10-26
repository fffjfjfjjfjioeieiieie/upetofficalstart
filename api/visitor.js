import { aggregateSummary, recordAggregate } from '../server/visitorAggregate.js';
import { founder, sameOrigin } from '../server/visitorSecurity.js';
import { checkPublicAnalyticsBurst, RateLimitError } from '../server/rateLimit.js';

const bodyOf = (req) => typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
const fail = (res, status, error) => res.status(status).json({ error });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      await founder(req);
      return res.status(200).json({ summary: await aggregateSummary(req.query?.days) });
    }
    if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
    if (!sameOrigin(req)) return fail(res, 403, 'Invalid origin.');
    if (Number(req.headers['content-length'] || 0) > 2048) return fail(res, 413, 'Request is too large.');
    checkPublicAnalyticsBurst(req);
    const body = bodyOf(req);
    if (body.mode && body.mode !== 'aggregate') return fail(res, 410, 'Visitor diagnostics have been removed.');
    const recorded = await recordAggregate(req, body);
    return res.status(200).json({ recorded: !!recorded });
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.setHeader('Retry-After', String(error.retryAfterSeconds));
      return fail(res, 429, error.message);
    }
    if (/sign in|cannot manage/i.test(error.message)) return fail(res, 401, 'Founder access required.');
    if (/invalid event|invalid feature/i.test(error.message)) return fail(res, 400, error.message);
    console.error('Visitor aggregate error:', error);
    return fail(res, 500, 'Visitor request failed.');
  }
}
