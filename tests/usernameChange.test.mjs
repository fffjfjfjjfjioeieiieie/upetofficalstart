import test from 'node:test';
import assert from 'node:assert/strict';
import { USERNAME_CHANGE_COOLDOWN_MS, renameProfileDocument, usernameChangeStatus, validateUsernameChange } from '../server/usernamePolicy.js';

test('username changes enforce a two hour cooldown', () => {
  const now = 10_000_000;
  assert.equal(usernameChangeStatus(now - USERNAME_CHANGE_COOLDOWN_MS, now).allowed, true);
  assert.equal(usernameChangeStatus(now - USERNAME_CHANGE_COOLDOWN_MS + 1, now).allowed, false);
  assert.throws(() => validateUsernameChange('fresh-name', { currentUsername: 'old-name', email: 'member@example.com', lastChangedAt: now - 60_000, now }), /119 minutes/);
});

test('username changes validate and rewrite stored profile identity', () => {
  assert.equal(validateUsernameChange(' New.Name ', { currentUsername: 'old-name', email: 'member@example.com' }), 'new.name');
  assert.throws(() => validateUsernameChange('old-name', { currentUsername: 'old-name', email: 'member@example.com' }), /different/);
  const renamed = renameProfileDocument({ username: 'old-name', redesign: { username: 'old-name', displayName: 'Same display name' } }, 'new-name');
  assert.equal(renamed.username, 'new-name');
  assert.equal(renamed.redesign.username, 'new-name');
  assert.equal(renamed.redesign.displayName, 'Same display name');
});
