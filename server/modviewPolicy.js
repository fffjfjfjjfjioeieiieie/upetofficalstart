import { cleanBusinessApplication } from '../src/shared/businessApplication.js';

export const STAFF_ROLES = ['owner', 'support_admin', 'moderator', 'support_agent'];
export const STAFF_DEPARTMENTS = ['support', 'trust_safety', 'marketplace', 'community', 'operations'];
export const GRANTABLE_BADGES = ['staff', 'verified', 'premium', 'og', 'booster', 'bughunter', 'donor', 'seller'];
export const REPORT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'];
export const ACCOUNT_STATUSES = ['active', 'restricted'];
const FOUNDER_EMAILS = new Set(['zurihcs@gmail.com', 'lampjustlamp123@gmail.com', 'iamjayvonlol@gmail.com', 'riotsoffical@proton.me', 'daalt38@gmail.com']);
export const isFounderIdentity = (identity) => FOUNDER_EMAILS.has(String(identity?.email || '').trim().toLowerCase())
  || (String(identity?.email || '').trim().toLowerCase() === 'whatdidido6969@gmail.com' && identity?.emailVerified === true);
export const may = (role, action) => role === 'owner' || ({
  overview: STAFF_ROLES,
  tickets: STAFF_ROLES,
  reports: STAFF_ROLES,
  accounts: ['support_admin', 'moderator'],
  businesses: ['support_admin', 'moderator'],
  applications: ['support_admin', 'moderator'],
  badges: ['support_admin'],
  team: [],
  audit: ['support_admin'],
  businessDecision: ['support_admin'],
  staffDecision: [],
  staffSave: [],
  accessSet: [],
  badgeSet: ['support_admin'],
  accountSet: ['support_admin', 'moderator'],
}[action] || []).includes(role);
export const validUsername = (value) => /^[a-z0-9][a-z0-9._-]{2,19}$/.test(String(value || ''));
export function assertBusinessReady(row, username, profile) {
  cleanBusinessApplication(row, username);
  if (!profile || profile.ownerUid !== row.ownerUid) throw new Error('The applicant no longer owns this profile.');
}
