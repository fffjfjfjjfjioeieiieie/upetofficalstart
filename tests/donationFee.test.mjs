import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlatformFee, PLATFORM_FEE_RATE } from '../server/donations.js';

test('donation platform fee is rounded to the nearest penny at the configured rate', () => {
  assert.equal(PLATFORM_FEE_RATE, 0.02);
  assert.equal(calculatePlatformFee(300), 6);
  assert.equal(calculatePlatformFee(999), 20);
  assert.equal(calculatePlatformFee(500000), 10000);
});
