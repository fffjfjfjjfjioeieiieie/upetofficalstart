import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileDocument, migrateProfile, toRendererProfile, validateProfileForSave } from '../src/shared/profileSchema.js';
import { redesignFromDocument, documentFromRedesign, sanitizeRedesignProfile } from '../src/redesign/lib/profileModel.js';
import { profileName } from '../src/shared/profileIdentity.js';
import { createEntryPassword, verifyEntryPassword } from '../src/redesign/lib/entryPassword.js';

test('entry settings survive publication and entry passwords verify', async () => {
  const password = await createEntryPassword('secret phrase');
  const profile = sanitizeRedesignProfile({ entry: { mode: 'password', title: 'Welcome', subtitle: 'Come in', textEffect: 'glitch', ...password } }, 'lamp');
  const saved = documentFromRedesign(profile, 'owner', 'lamp');
  const publicProfile = redesignFromDocument(saved, 'lamp');
  assert.equal(publicProfile.entry.mode, 'password');
  assert.equal(publicProfile.entry.title, 'Welcome');
  assert.equal(publicProfile.entry.textEffect, 'glitch');
  assert.equal(await verifyEntryPassword('secret phrase', publicProfile.entry), true);
  assert.equal(await verifyEntryPassword('wrong phrase', publicProfile.entry), false);
  assert.equal(redesignFromDocument(null, 'kid').entry.mode, 'button');
});

test('new and existing placeholder profiles use their claimed username', () => {
  assert.equal(redesignFromDocument(null, 'kid').displayName, 'kid');
  assert.equal(redesignFromDocument(null, 'kid').alias, 'kid');
  assert.equal(redesignFromDocument({ redesign: { displayName: 'your name', alias: 'Your Name' } }, 'kid').displayName, 'kid');
  assert.equal(profileName('A chosen name', 'kid'), 'A chosen name');
});

test('legacy Dome fields migrate to a versioned document without losing music or links', () => {
  const document = migrateProfile({ username: 'dome', displayName: 'dome', audioUrl: '/song.mp3', trackTitle: 'Lucid Dreams', trackArtist: 'Juice WRLD', links: [{ label: 'Discord', url: 'https://discord.gg/upet' }] });
  assert.equal(document.schemaVersion, 1);
  assert.equal(document.audio.tracks[0].title, 'Lucid Dreams');
  assert.equal(document.blocks[0].content.url, 'https://discord.gg/upet');
  assert.equal(toRendererProfile(document, { username: 'dome' }).links[0].label, 'Discord');
});

test('legacy click sounds are discarded while profile music remains available', () => {
  const document = migrateProfile({ username: 'lamp', audioUrl: '/music.mp3', clickSoundEnabled: true, clickSoundUrl: '/tick.mp3', clickSoundVolume: 100 });
  const renderer = toRendererProfile(document, { username: 'lamp' });
  assert.equal(renderer.audioUrl, '/music.mp3');
  assert.equal('clickSoundEnabled' in renderer, false);
  assert.equal('clickSoundUrl' in renderer, false);
  assert.equal('clickSound' in document.effects, false);
  const published = createProfileDocument({ username: 'lamp' });
  published.effects.clickSound = '/tick.mp3';
  published.effects.clickSoundEnabled = true;
  assert.equal('clickSound' in migrateProfile(published).effects, false);
});

test('draft and renderer preserve ordered blocks', () => {
  const document = createProfileDocument({ username: 'lamp' });
  document.blocks.push({ id: 'one', type: 'heading', enabled: true, order: 0, style: {}, content: { text: 'Hello' } });
  assert.deepEqual(validateProfileForSave(document).blocks, document.blocks);
  assert.equal(toRendererProfile(document, { username: 'lamp' }).blocks[0].content.text, 'Hello');
});

test('temporary assets cannot be saved', () => {
  const document = createProfileDocument({ username: 'lamp' });
  document.identity.avatar = 'blob:preview';
  assert.throws(() => validateProfileForSave(document), /upload is still previewing/i);
});

test('new customization controls default safely and reach the shared renderer', () => {
  const original = createProfileDocument({ username: 'dome' });
  const legacyV1 = structuredClone(original);
  delete legacyV1.behavior;
  delete legacyV1.theme.avatar.borderWidth;
  delete legacyV1.audio.showProgress;
  const migrated = migrateProfile(legacyV1);
  assert.equal(migrated.behavior.linkAction, 'open');
  assert.equal(migrated.theme.avatar.borderWidth, 4);
  assert.equal(migrated.audio.showProgress, true);

  migrated.behavior.linkAction = 'both';
  migrated.behavior.analyticsEnabled = false;
  migrated.background.scale = 125;
  migrated.effects.cursorHotspotX = 8;
  const renderer = toRendererProfile(migrated, { username: 'dome' });
  assert.equal(renderer.linkAction, 'both');
  assert.equal(renderer.analyticsEnabled, false);
  assert.equal(renderer.backgroundScale, 125);
  assert.equal(renderer.cursorHotspotX, 8);
});

