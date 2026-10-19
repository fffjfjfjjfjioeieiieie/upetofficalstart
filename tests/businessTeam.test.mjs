import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/business-team.js';

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test('business team API rejects unauthenticated changes before touching membership', async () => {
  const res = response();
  await handler({ method: 'POST', headers: {}, body: { businessId: 'lamp', username: 'test', role: 'manager' } }, res);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /sign in/i);
});

test('business team API accepts only role-management methods', async () => {
  const res = response();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 405);
});
