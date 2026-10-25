import { getAuth } from 'firebase-admin/auth';
import { database } from '../server/visitorStore.js';
import {
  applyFounderClaimMigration,
  parseRecoveryUids,
  planFounderClaimMigration,
} from '../server/v2/trustedClaimMigration.js';

const apply = process.argv.includes('--apply');
const uids = parseRecoveryUids(process.env.UPET_FOUNDER_RECOVERY_UIDS);

if (!uids.length) {
  throw new Error('Set UPET_FOUNDER_RECOVERY_UIDS to a comma-separated UID allowlist.');
}

// Initialize the existing Admin app without reading or writing application data.
database();
const auth = getAuth();
const plans = await planFounderClaimMigration({ auth, uids });
const result = await applyFounderClaimMigration({ auth, plans, apply });

console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  applied: result.applied,
  accounts: plans.map((plan) => ({ uid: plan.uid, roles: plan.after.roles })),
}, null, 2));

if (!apply) console.log('No claims were changed. Re-run with --apply after reviewing this plan.');
