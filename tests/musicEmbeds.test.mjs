import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMusicEmbed, sanitizeMusicEmbed } from '../src/shared/musicEmbeds.js';
import { documentFromRedesign, redesignFromDocument, sanitizeRedesignProfile } from '../src/redesign/lib/profileModel.js';

test('Spotify catalog links become official embeds', () => {
  const result = parseMusicEmbed('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=abc');
  assert.equal(result.provider, 'spotify');
  assert.equal(result.sourceUrl, 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
  assert.match(result.embedUrl, /^https:\/\/open\.spotify\.com\/embed\/track\//);
});

test('YouTube Music, YouTube playlists, and SoundCloud links become official embeds', () => {
  const music = parseMusicEmbed('https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RDAMVMtest');
  assert.equal(music.provider, 'youtube');
  assert.equal(music.id, 'dQw4w9WgXcQ');
  assert.match(music.embedUrl, /^https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ/);
  assert.match(parseMusicEmbed('https://www.youtube.com/playlist?list=PL123_safe').embedUrl, /videoseries/);
  const soundcloud = parseMusicEmbed('https://soundcloud.com/example/song-name');
  assert.equal(soundcloud.provider, 'soundcloud');
  assert.match(soundcloud.embedUrl, /^https:\/\/w\.soundcloud\.com\/player/);
});

test('lookalike, insecure, and unsupported music links are rejected', () => {
  for (const value of ['https://open.spotify.com.evil.test/track/abc', 'http://open.spotify.com/track/abc', 'javascript:alert(1)', 'https://example.com/song.mp3', 'https://spotify.link/short']) {
    assert.equal(parseMusicEmbed(value), null);
  }
  assert.equal(sanitizeMusicEmbed({ sourceUrl: 'https://example.com' }).embedUrl, '');
});

test('streaming sources sanitize and survive profile publication', () => {
  const profile = sanitizeRedesignProfile({ audio: { sourceType: 'embed', sourceUrl: 'https://youtu.be/dQw4w9WgXcQ', src: 'https://evil.test/song.mp3' } }, 'music');
  assert.equal(profile.audio.sourceType, 'embed');
  assert.equal(profile.audio.embedProvider, 'youtube');
  assert.equal(profile.audio.src, '');
  const restored = redesignFromDocument(documentFromRedesign(profile, 'owner', 'music'), 'music');
  assert.equal(restored.audio.sourceType, 'embed');
  assert.equal(restored.audio.sourceUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});
