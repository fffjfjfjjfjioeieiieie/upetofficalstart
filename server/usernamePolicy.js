import { canClaimSpecialUsername, normalizeUsername } from '../src/shared/username.js';
import { RATE_LIMITS } from '../src/shared/rateLimits.js';

export const USERNAME_CHANGE_COOLDOWN_MS = RATE_LIMITS.usernameChangeWindowMs;

export function timestampMillis(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (Number.isFinite(Number(value?._seconds))) return Number(value._seconds) * 1000;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function usernameChangeStatus(lastChangedAt, now = Date.now()) {
  const changedAt = timestampMillis(lastChangedAt);
  const nextChangeAt = changedAt ? changedAt + USERNAME_CHANGE_COOLDOWN_MS : 0;
  return { allowed: !nextChangeAt || now >= nextChangeAt, nextChangeAt };
}

export function validateUsernameChange(rawUsername, { currentUsername, email, lastChangedAt, now = Date.now() }) {
  const username = normalizeUsername(rawUsername);
  if (!canClaimSpecialUsername(username, email)) throw new Error('That username is unavailable.');
  if (username === currentUsername) throw new Error('Choose a different username.');
  const status = usernameChangeStatus(lastChangedAt, now);
  if (!status.allowed) {
    const minutes = Math.max(1, Math.ceil((status.nextChangeAt - now) / 60_000));
    throw new Error(`You can change your username again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
  }
  return username;
}

export function renameProfileDocument(document, username) {
  if (!document || typeof document !== 'object') return document;
  return {
    ...document,
    username,
    ...(document.redesign && typeof document.redesign === 'object'
      ? { redesign: { ...document.redesign, username } }
      : {}),
  };
}
