import test from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO_EXTENSION_MIME, AUDIO_INPUT_ACCEPT, AUDIO_MIME_TYPES } from '../src/shared/mediaTypes.js';

test('the shared audio picker exposes common music formats explicitly', () => {
  for (const extension of ['.mp3', '.m4a', '.wav', '.ogg', '.opus', '.aac', '.flac', '.mp4', '.webm']) {
    assert.ok(AUDIO_INPUT_ACCEPT.split(',').includes(extension), `${extension} should be selectable`);
  }
});

test('audio extensions normalize to upload API content types', () => {
  for (const type of Object.values(AUDIO_EXTENSION_MIME)) assert.ok(AUDIO_MIME_TYPES.includes(type));
  assert.equal(AUDIO_EXTENSION_MIME.mp3, 'audio/mpeg');
  assert.equal(AUDIO_EXTENSION_MIME.m4a, 'audio/mp4');
  assert.equal(AUDIO_EXTENSION_MIME.flac, 'audio/flac');
});
