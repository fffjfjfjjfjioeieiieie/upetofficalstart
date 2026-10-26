export function routeOf(value) {
  if (typeof value !== 'string' || value.length > 500) return '/';
  try {
    const path = new URL(value, 'https://user.pet').pathname;
    return path.startsWith('/') ? path.slice(0, 160) : '/';
  } catch { return '/'; }
}

export function countryOf(headers = {}) {
  const value = String(headers['x-vercel-ip-country'] || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(value) ? value : 'Unknown';
}

export function deviceOf(headers = {}) {
  const agent = String(headers['user-agent'] || '').toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(agent)) return 'Tablet';
  if (/mobi|iphone|android/.test(agent)) return 'Mobile';
  return agent ? 'Desktop' : 'Unknown';
}

export function browserOf(headers = {}) {
  const agent = String(headers['user-agent'] || '').toLowerCase();
  if (/edg\//.test(agent)) return 'Edge';
  if (/firefox\//.test(agent)) return 'Firefox';
  if (/opr\//.test(agent)) return 'Opera';
  if (/chrome\//.test(agent)) return 'Chrome';
  if (/safari\//.test(agent)) return 'Safari';
  return agent ? 'Other' : 'Unknown';
}

export function referrerOf(value) {
  if (!value) return 'Direct';
  try {
    const hostname = new URL(String(value)).hostname.toLowerCase().replace(/^www\./, '');
    return hostname && !['user.pet', 'www.user.pet'].includes(hostname) ? hostname.slice(0, 80) : 'Direct';
  } catch { return 'Direct'; }
}

const FEATURES = new Set([
  'Explore profiles', 'Open profile', 'Profile links',
  'Music player', 'Dashboard', 'Profile editor', 'Profiles', 'Badges', 'Leaderboard',
  'Statistics', 'Settings', 'Log in', 'Connect Discord', 'Copy profile link', 'Theme',
]);

export function featureOf(value) {
  const feature = String(value || '').trim().slice(0, 60);
  return FEATURES.has(feature) ? feature : '';
}
