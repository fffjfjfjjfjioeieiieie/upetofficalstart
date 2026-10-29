import { getAuth } from 'firebase-admin/auth';
import { database } from '../server/visitorStore.js';
import { createInvitedAccount } from '../server/inviteSignup.js';
import { checkSignupBurst, RateLimitError } from '../server/rateLimit.js';

const bodyOf = (request) => typeof request.body === 'object' && request.body ? request.body : JSON.parse(request.body || '{}');

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    checkSignupBurst(request);
    const result = await createInvitedAccount({ db: database(), auth: getAuth(), ...bodyOf(request) });
    return response.status(201).json({ ok: true, email: result.email });
  } catch (error) {
    if (error instanceof RateLimitError) {
      response.setHeader('Retry-After', String(error.retryAfterSeconds));
      return response.status(429).json({ error: error.message });
    }
    const message = error?.code === 'auth/email-already-exists'
      ? 'An account already exists for this email. Sign in instead.'
      : error?.message || 'Account creation failed.';
    return response.status(400).json({ error: message });
  }
}
