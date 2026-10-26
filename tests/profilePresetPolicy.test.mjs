import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPresetName, MAX_PROFILE_PRESETS, presetPreview } from '../server/profilePresetPolicy.js';

test('profile preset storage is capped at five named snapshots', () => {
  assert.equal(MAX_PROFILE_PRESETS, 5);
  assert.equal(cleanPresetName('  Night profile  '), 'Night profile');
  assert.throws(() => cleanPresetName('   '), /name/i);
});

test('preset previews omit playable audio and large lyric data', () => {
  const preview = presetPreview({ redesign: { audio: { src: 'https://example.com/song.mp3', autoplay: true, lyrics: { lines: [{ text: 'line' }] } }, links: Array.from({ length: 8 }, (_, id) => ({ id })) } }, 'lamp');
  assert.equal(preview.audio.src, '');
  assert.equal(preview.audio.autoplay, false);
  assert.deepEqual(preview.audio.lyrics.lines, []);
  assert.equal(preview.links.length, 6);
});
