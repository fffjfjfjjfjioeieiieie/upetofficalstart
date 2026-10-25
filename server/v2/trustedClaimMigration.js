import { TRUSTED_ROLES, trustedRolesFromClaims } from './authClaims.js';

export function mergeTrustedRoles(currentClaims = {}, requestedRoles = []) {
  const roles = [...new Set([
    ...trustedRolesFromClaims(currentClaims),
    ...requestedRoles.filter((role) => TRUSTED_ROLES.includes(role)),
  ])].sort();
  return {
    ...currentClaims,
    roles,
    founder: roles.includes('founder'),
    admin: roles.includes('admin'),
    moderator: roles.includes('moderator'),
    support: roles.includes('support'),
  };
}

export function parseRecoveryUids(value) {
  return [...new Set(String(value || '')
    .split(',')
    .map((uid) => uid.trim())
    .filter((uid) => /^[A-Za-z0-9:_-]{4,128}$/.test(uid)))];
}

export async function planFounderClaimMigration({ auth, uids } = {}) {
  if (!auth?.getUser) throw new TypeError('A Firebase Admin Auth instance is required.');
  const normalizedUids = parseRecoveryUids(Array.isArray(uids) ? uids.join(',') : uids);
  const plans = [];
  for (const uid of normalizedUids) {
    const user = await auth.getUser(uid);
    plans.push(Object.freeze({
      uid,
      before: Object.freeze({ ...(user.customClaims || {}) }),
      after: Object.freeze(mergeTrustedRoles(user.customClaims || {}, ['founder'])),
    }));
  }
  return Object.freeze(plans);
}

export async function applyFounderClaimMigration({ auth, plans, apply = false } = {}) {
  if (!apply) return Object.freeze({ applied: false, count: 0, plans });
  if (!auth?.setCustomUserClaims) throw new TypeError('A Firebase Admin Auth instance is required.');
  for (const plan of plans) await auth.setCustomUserClaims(plan.uid, plan.after);
  return Object.freeze({ applied: true, count: plans.length, plans });
}
