import test from 'node:test';
import assert from 'node:assert/strict';
import { assertBusinessReady, may } from '../server/modviewPolicy.js';
import { applyProfileGrants } from '../src/redesign/lib/profileGrants.js';
import { sanitizeRedesignProfile } from '../src/redesign/lib/profileModel.js';

const row = { ownerUid: 'u1', username: 'bright', businessName: 'Bright Goods', category: 'physical', businessType: 'registered', country: 'United Kingdom', description: 'A small stationery business based in London.', website: '', shopUrl: 'https://user.pet/bright/shop', publicProofUrl: 'https://example.com/bright', proofExplanation: 'The public page names Bright Goods and links to its shop.', ownerRole: 'owner', supportEmail: 'help@example.com', fulfillment: 'Orders are shipped within three working days.' };

test('staff role boundaries keep founder actions separate', () => {
  assert.equal(may('support_agent', 'tickets'), true);
  assert.equal(may('support_agent', 'accounts'), false);
  assert.equal(may('moderator', 'accountSet'), true);
  assert.equal(may('moderator', 'badgeSet'), false);
  assert.equal(may('support_admin', 'businessDecision'), true);
  assert.equal(may('support_admin', 'staffSave'), false);
  assert.equal(may('owner', 'staffSave'), true);
});

test('business approval needs complete answers and profile ownership', () => {
  assert.doesNotThrow(() => assertBusinessReady(row, 'bright', { ownerUid: 'u1', published: { redesign: { shop: { enabled: true } } } }));
  assert.throws(() => assertBusinessReady(row, 'bright', { ownerUid: 'u2' }), /no longer owns/i);
  assert.doesNotThrow(() => assertBusinessReady(row, 'bright', { ownerUid: 'u1' }));
});

test('official badge grants appear once and legacy owner is removed', () => {
  const result = applyProfileGrants({ badges: ['owner'], shownBadges: ['owner'] }, ['staff', 'staff', 'verified']);
  assert.deepEqual(result.badges, ['staff', 'verified']);
  assert.deepEqual(result.shownBadges, ['staff', 'verified']);
});

test('badge visibility preferences and ordering survive grants', () => {
  const result = applyProfileGrants(
    { badges: [], shownBadges: [], hiddenBadges: ['staff'], badgeOrder: ['verified', 'staff'] },
    ['staff', 'verified'],
  );
  assert.deepEqual(result.badges, ['verified', 'staff']);
  assert.deepEqual(result.shownBadges, ['verified']);
  assert.deepEqual(result.hiddenBadges, ['staff']);
});

test('a profile owner cannot publish an official badge without a grant', () => {
  const profile = sanitizeRedesignProfile({ badges: ['staff', 'verified'], shownBadges: ['staff', 'verified'] }, 'ordinary');
  assert.deepEqual(profile.badges, []);
  assert.deepEqual(profile.shownBadges, []);
});
