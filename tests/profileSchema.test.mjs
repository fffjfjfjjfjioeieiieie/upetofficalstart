import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileDocument, migrateProfile, toRendererProfile, validateProfileForSave } from '../src/shared/profileSchema.js';

test('legacy Dome fields migrate to a versioned document without losing music or links', () => {
  const document = migrateProfile({ username: 'dome', displayName: 'dome', audioUrl: '/song.mp3', trackTitle: 'Lucid Dreams', trackArtist: 'Juice WRLD', links: [{ label: 'Discord', url: 'https://discord.gg/upet' }] });
  assert.equal(document.schemaVersion, 1);
  assert.equal(document.audio.tracks[0].title, 'Lucid Dreams');
  assert.equal(document.blocks[0].content.url, 'https://discord.gg/upet');
  assert.equal(toRendererProfile(document, { username: 'dome' }).links[0].label, 'Discord');
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

