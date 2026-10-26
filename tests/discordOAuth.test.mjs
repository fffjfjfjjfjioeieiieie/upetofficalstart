import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscordState, discordRedirectUri, requestOrigin, verifyDiscordState } from '../server/discordOAuth.js';
import { discordCallbackPage } from '../api/discord-callback.js';

test('Discord OAuth always uses one production callback across site aliases', () => {
  const previous = process.env.DISCORD_REDIRECT_URI;
  delete process.env.DISCORD_REDIRECT_URI;
  assert.equal(discordRedirectUri({ headers: { host: 'user.pet' } }), 'https://www.user.pet/api/discord-callback');
  assert.equal(discordRedirectUri({ headers: { host: 'www.user.pet' } }), 'https://www.user.pet/api/discord-callback');
  if (previous === undefined) delete process.env.DISCORD_REDIRECT_URI;
  else process.env.DISCORD_REDIRECT_URI = previous;
});

test('Discord OAuth state returns the connection to the alias that opened it', () => {
  const previous = process.env.DISCORD_CLIENT_SECRET;
  process.env.DISCORD_CLIENT_SECRET = 'discord-oauth-test-secret';
  const state = verifyDiscordState(createDiscordState('firebase-user', 'https://user.pet'));
  assert.equal(state.uid, 'firebase-user');
  assert.equal(state.returnOrigin, 'https://user.pet');
  if (previous === undefined) delete process.env.DISCORD_CLIENT_SECRET;
  else process.env.DISCORD_CLIENT_SECRET = previous;
});

test('OAuth return origins reject untrusted forwarded hosts', () => {
  assert.equal(requestOrigin({ headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'user.pet' } }), 'https://user.pet');
  assert.equal(requestOrigin({ headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'attacker.example' } }), 'https://www.user.pet');
});

test('Discord callback can finish a connection when a mobile browser has no popup opener', () => {
  const connection = { id: '123456789012345678', username: 'Friend', handle: 'friend', avatar: '' };
  const html = discordCallbackPage('https://www.user.pet', { type: 'upet-discord-connected', uid: 'firebase-user', connection });
  assert.match(html, /window\.opener\.postMessage/);
  assert.match(html, /location\.replace/);
  assert.ok(html.includes(encodeURIComponent(JSON.stringify({ type: 'upet-discord-connected', uid: 'firebase-user', connection }))));
});
