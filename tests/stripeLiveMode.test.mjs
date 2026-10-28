import assert from 'node:assert/strict';
import test from 'node:test';
import { stripeRequest } from '../server/donations.js';

test('Stripe requests reject missing and test-mode keys', async () => {
  const original = process.env.STRIPE_SECRET_KEY;
  try {
    delete process.env.STRIPE_SECRET_KEY;
    await assert.rejects(stripeRequest('accounts'), /live mode is not configured/);
    process.env.STRIPE_SECRET_KEY = 'sk_test_example';
    await assert.rejects(stripeRequest('accounts'), /live mode is not configured/);
  } finally {
    if (original === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = original;
  }
});

test('Stripe requests accept live secret and restricted keys and reject non-live API objects', async () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;
  const originalFetch = globalThis.fetch;
  process.env.STRIPE_SECRET_KEY = 'sk_live_example';
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ id: 'acct_live', livemode: true }) });
    assert.equal((await stripeRequest('accounts/acct_live')).id, 'acct_live');

    process.env.STRIPE_SECRET_KEY = 'rk_live_example';
    assert.equal((await stripeRequest('accounts/acct_live')).id, 'acct_live');

    globalThis.fetch = async () => ({ ok: true, json: async () => ({ id: 'acct_test', livemode: false }) });
    await assert.rejects(stripeRequest('accounts/acct_test'), /non-live object/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalKey;
  }
});
