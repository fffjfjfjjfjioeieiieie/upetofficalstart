import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canUseFounderRecovery,
  identityFromFirebasePayload,
} from '../server/firebaseAuth.js';
import {
  applyFounderClaimMigration,
  mergeTrustedRoles,
  parseRecoveryUids,
  planFounderClaimMigration,
} from '../server/v2/trustedClaimMigration.js';

test('verified identities carry only trusted role claims and never derive authority from email', () => {
  const identity = identityFromFirebasePayload({
    sub: 'owner-a',
    email: 'former-founder@example.com',
    email_verified: true,
    roles: ['founder', 'unknown'],
    admin: true,
  });
  assert.deepEqual(identity.claims.roles, ['founder', 'unknown']);
  assert.equal(identity.claims.admin, true);
  assert.equal(canUseFounderRecovery(identity, new Set()), false);
  assert.equal(canUseFounderRecovery(identity, new Set(['owner-a'])), true);
  assert.equal(canUseFounderRecovery({ ...identity, uid: 'different' }, new Set(['owner-a'])), false);
});

test('claim migration preserves unrelated claims and adds normalized trusted roles', async () => {
  assert.deepEqual(parseRecoveryUids(' founder-a,founder-a,invalid uid,founder_b '), ['founder-a', 'founder_b']);
  assert.deepEqual(mergeTrustedRoles({ tenant: 'alpha', roles: ['support'] }, ['founder', 'unsupported']), {
    tenant: 'alpha',
    roles: ['founder', 'support'],
    founder: true,
    admin: false,
    moderator: false,
    support: true,
  });

  const writes = [];
  const auth = {
    getUser: async (uid) => ({ uid, customClaims: { tenant: 'alpha', moderator: true } }),
    setCustomUserClaims: async (uid, claims) => writes.push({ uid, claims }),
  };
  const plans = await planFounderClaimMigration({ auth, uids: ['founder-a'] });
  assert.deepEqual(plans[0].after.roles, ['founder', 'moderator']);
  assert.equal((await applyFounderClaimMigration({ auth, plans })).applied, false);
  assert.deepEqual(writes, []);
  const result = await applyFounderClaimMigration({ auth, plans, apply: true });
  assert.equal(result.count, 1);
  assert.equal(writes[0].claims.tenant, 'alpha');
});
