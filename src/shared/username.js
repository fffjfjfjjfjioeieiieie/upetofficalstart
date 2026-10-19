export const RESERVED_USERNAMES = new Set(['dashboard', 'business', 'business-verification', 'biz', 'customize', 'analytics', 'settings', 'claim', 'welcome', 'create-account', 'login', 'admin', 'api', 'assets']);
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,19}$/;

export function normalizeUsername(value) {
  const username = String(value || '').trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username) || RESERVED_USERNAMES.has(username)) throw new Error('Use 3–20 letters, numbers, dots, underscores, or hyphens. This name may be reserved.');
  return username;
}

export function canClaimSpecialUsername(username, email) {
  return username !== 'dome' || String(email || '').trim().toLowerCase() === 'zurihcs@gmail.com';
}
