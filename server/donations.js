import { createHmac, timingSafeEqual } from 'node:crypto';
export { STRIPE_ESTIMATE_RATE, STRIPE_ESTIMATE_FIXED, PLATFORM_MARGIN_RATE, calculateDonationFee, calculateDonationCharge } from '../src/shared/donationFees.js';

export const DONATION_MIN_PENCE = 300;
export const DONATION_MAX_PENCE = 500000;

export function cleanText(value, maxLength) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function stripeAccountStatus(account) {
  return account?.charges_enabled === true && account?.details_submitted === true ? 'ready' : 'pending';
}

function appendParams(target, value, prefix) {
  if (value === undefined || value === null) return;
  if (typeof value === 'object' && !Array.isArray(value)) {
    Object.entries(value).forEach(([key, child]) => appendParams(target, child, prefix ? `${prefix}[${key}]` : key));
    return;
  }
  target.append(prefix, typeof value === 'boolean' ? String(value) : value);
}

export async function stripeRequest(path, { method = 'GET', params, idempotencyKey } = {}) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !secret.startsWith('sk_test_')) throw new Error('Stripe test mode is not configured.');
  const body = new URLSearchParams();
  if (params) appendParams(body, params, '');
  const query = method === 'GET' && body.size ? `?${body}` : '';
  const response = await fetch(`https://api.stripe.com/v1/${path}${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(method === 'GET' ? {} : { 'Content-Type': 'application/x-www-form-urlencoded' }),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: method === 'GET' ? undefined : body,
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result?.error?.message || 'Stripe request failed.');
    error.statusCode = response.status;
    throw error;
  }
  return result;
}

export function publicSiteUrl() {
  const value = String(process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(value)) throw new Error('PUBLIC_SITE_URL is not configured.');
  return value;
}

export async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export function verifyStripeSignature(rawBody, signatureHeader, secret = process.env.STRIPE_WEBHOOK_SECRET) {
  if (!secret) throw new Error('Stripe webhook is not configured.');
  const parts = String(signatureHeader || '').split(',').map((part) => part.split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
  return signatures.some((candidate) => {
    const a = Buffer.from(candidate);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}
