import assert from 'node:assert/strict';
import test from 'node:test';
import { nextDonationStats } from '../server/donations.js';

test('donation stats increment totals and keep bounded recent entries', () => {
  const existing = {
    totalRaised: 500,
    estimatedFees: 38,
    donationCount: 1,
    recentDonations: Array.from({ length: 10 }, (_, index) => ({ id: `old-${index}` })),
    recentSupporters: Array.from({ length: 5 }, (_, index) => ({ name: `Old ${index}` })),
  };
  const next = nextDonationStats(existing, { id: 'new', amount: 1000, fee: 55, donorName: 'Ada', message: 'Good luck', anonymous: false, createdAt: 123 });
  assert.equal(next.totalRaised, 1500);
  assert.equal(next.estimatedFees, 93);
  assert.equal(next.donationCount, 2);
  assert.equal(next.recentDonations.length, 10);
  assert.equal(next.recentDonations[0].id, 'new');
  assert.equal(next.recentSupporters.length, 5);
  assert.equal(next.recentSupporters[0].name, 'Ada');
});

test('anonymous donations never appear in public supporters', () => {
  const next = nextDonationStats({ recentSupporters: [{ name: 'Previous' }] }, { id: 'anonymous', amount: 500, fee: 38, anonymous: true, createdAt: 123 });
  assert.deepEqual(next.recentSupporters, [{ name: 'Previous' }]);
  assert.equal(next.recentDonations[0].anonymous, true);
});
