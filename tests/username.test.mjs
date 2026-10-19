import test from 'node:test';
import assert from 'node:assert/strict';
import { canClaimSpecialUsername, normalizeUsername } from '../src/shared/username.js';

test('claims normalize case and whitespace without changing punctuation', () => {
  assert.equal(normalizeUsername('  My.Name_1  '), 'my.name_1');
});

test('reserved and invalid names cannot be claimed', () => {
  for (const name of ['dashboard', 'business', 'biz', 'Admin', 'ab', 'bad/name', 'contains space', 'a'.repeat(21)]) assert.throws(() => normalizeUsername(name));
});

test('Dome is restricted to the associated founder email', () => {
  assert.equal(canClaimSpecialUsername('dome', 'zurihcs@gmail.com'), true);
  assert.equal(canClaimSpecialUsername('dome', 'iamjayvonlol@gmail.com'), false);
  assert.equal(canClaimSpecialUsername('lamp', 'iamjayvonlol@gmail.com'), true);
});
