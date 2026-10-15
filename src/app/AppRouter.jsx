import { RESERVED_USERNAMES } from '../shared/username.js';
export const RESERVED_PATHS = RESERVED_USERNAMES;
export const PROTECTED_PATHS = new Set(['/dashboard', '/welcome', '/customize', '/analytics', '/settings', '/claim']);

export function resolveAppRoute(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { kind: 'home' };
  if (path === '/create-account') return { kind: 'auth' };
  if (PROTECTED_PATHS.has(path)) return { kind: path.slice(1), protected: true };
  const username = path.match(/^\/([a-z0-9][a-z0-9._-]{2,19})$/)?.[1];
  if (username && !RESERVED_PATHS.has(username)) return { kind: 'profile', username };
  return { kind: 'not-found' };
}
