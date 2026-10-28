import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDonationCharge, calculateDonationFee, PLATFORM_MARGIN_RATE, STRIPE_ESTIMATE_FIXED, STRIPE_ESTIMATE_RATE } from '../src/shared/donationFees.js';

test('donation fees include the Stripe estimate, margin, charity override, and fee coverage', () => {
  assert.equal(STRIPE_ESTIMATE_RATE, 0.015);
  assert.equal(STRIPE_ESTIMATE_FIXED, 20);
  assert.equal(PLATFORM_MARGIN_RATE, 0.02);
  assert.equal(calculateDonationFee(1000), 55);
  assert.equal(calculateDonationFee(1000, { charityApproved: true }), 35);
  assert.deepEqual(calculateDonationCharge(1000, { coverFees: true }), { chargeAmount: 1057, fee: 57 });
  assert.deepEqual(calculateDonationCharge(1000, { charityApproved: true, coverFees: true }), { chargeAmount: 1036, fee: 36 });
});
