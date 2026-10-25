import assert from 'node:assert/strict';
import test from 'node:test';
import { createV2ProfileHandler } from '../api/v2-profile.js';
import { createPublicV2ProfileHandler } from '../api/v2-profile-public.js';
import { createPublicV2LyricsHandler } from '../api/v2-profile-lyrics.js';
import {
  clearPublicProfileV2Cache,
  loadPublicProfileV2,
} from '../server/v2/publicProfileService.js';
import { createEmptyProfileDocumentV2, createProfileDraftV2 } from '../src/shared/contracts/index.js';
import { createPublicProfileProjectionV2 } from '../src/shared/contracts/publicProfileV2.js';
import { projectPublicLyricsV2 } from '../server/v2/publicLyricsService.js';

const response = () => ({
  statusCode: 200,
  headers: {},
  setHeader(key, value) { this.headers[key] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; },
});

class Snapshot {
  constructor(value) { this.value = value; this.exists = value !== undefined; }
  data() { return structuredClone(this.value); }
}

class FakeDatabase {
  constructor(entries = {}) { this.documents = new Map(Object.entries(structuredClone(entries))); this.reads = 0; }
  doc(path) { return { path }; }
  collection(name) {
    return { doc: (id) => ({
      get: async () => { this.reads += 1; return new Snapshot(this.documents.get(`${name}/${id}`)); },
    }) };
  }
  async runTransaction(callback) {
    const writes = [];
    const result = await callback({
      get: async (reference) => new Snapshot(this.documents.get(reference.path)),
      set: (reference, value) => writes.push([reference.path, structuredClone(value)]),
    });
    for (const [path, value] of writes) this.documents.set(path, value);
    return result;
  }
}

function fixture() {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner-a', username: 'safe-user', nowMs: 1_000 });
  profile.identity.displayName = 'Safe User';
  return {
    profile,
    draft: createProfileDraftV2(profile, { basePublishedRevision: 0, nowMs: 1_000 }),
    publicProfile: createPublicProfileProjectionV2({ ...profile, status: 'published', revision: 1 }),
  };
}

test('preview publish route stays disabled by default and requires a verified founder claim', async () => {
  const disabled = response();
  await createV2ProfileHandler({ enabled: () => false })({ method: 'POST', headers: {} }, disabled);
  assert.equal(disabled.statusCode, 404);

  const unsigned = response();
  await createV2ProfileHandler({ enabled: () => true, verifyIdentity: async () => { throw new Error('bad token'); } })({ method: 'POST', headers: {} }, unsigned);
  assert.equal(unsigned.statusCode, 401);

  const ordinary = response();
  await createV2ProfileHandler({ enabled: () => true, verifyIdentity: async () => ({ uid: 'owner-a', claims: {} }) })({ method: 'POST', headers: {} }, ordinary);
  assert.equal(ordinary.statusCode, 403);
});

test('preview publish route exposes only revision metadata and invalidates public cache after a changed publish', async () => {
  const { draft } = fixture();
  const db = new FakeDatabase({
    'profileV2Drafts/owner-a': draft,
    'usernames/safe-user': { uid: 'owner-a', username: 'safe-user' },
    'users/owner-a': { uid: 'owner-a', username: 'safe-user' },
  });
  const invalidations = [];
  const handler = createV2ProfileHandler({
    enabled: () => true,
    getDatabase: () => db,
    verifyIdentity: async () => ({ uid: 'owner-a', claims: { roles: ['founder'] } }),
    invalidate: async (username) => invalidations.push(username),
  });
  const result = response();
  await handler({ method: 'POST', headers: {}, body: { action: 'publish', username: 'safe-user' } }, result);
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { changed: true, revision: 1 });
  assert.deepEqual(invalidations, ['safe-user']);
  assert.equal('profile' in result.body, false);
});

test('preview draft route saves only private draft state and returns 409 for stale saves', async () => {
  const { profile } = fixture();
  const db = new FakeDatabase({
    'usernames/safe-user': { uid: 'owner-a', username: 'safe-user' },
    'users/owner-a': { uid: 'owner-a', username: 'safe-user' },
  });
  const handler = createV2ProfileHandler({
    enabled: () => true,
    getDatabase: () => db,
    verifyIdentity: async () => ({ uid: 'owner-a', claims: { roles: ['founder'] } }),
  });
  const request = { method: 'POST', headers: {}, body: { action: 'saveDraft', username: 'safe-user', profile, basePublishedRevision: 0, expectedDraftRevision: 0 } };
  const saved = response();
  await handler(request, saved);
  assert.equal(saved.statusCode, 200);
  assert.deepEqual(saved.body, { changed: true, draftRevision: 1, basePublishedRevision: 0 });
  assert.equal(db.documents.has('profileV2Public/safe-user'), false);
  const stale = response();
  await handler(request, stale);
  assert.equal(stale.statusCode, 409);
});

test('public route shares successful reads briefly and propagates backend failures', async () => {
  clearPublicProfileV2Cache();
  const { publicProfile } = fixture();
  const db = new FakeDatabase({ 'profileV2Public/safe-user': publicProfile });
  const [first, second] = await Promise.all([
    loadPublicProfileV2(db, 'safe-user'),
    loadPublicProfileV2(db, 'SAFE-USER'),
  ]);
  assert.equal(first.identity.displayName, 'Safe User');
  assert.deepEqual(second, first);
  assert.equal(db.reads, 1);

  const handler = createPublicV2ProfileHandler({ getDatabase: () => db });
  const responseValue = response();
  await handler({ method: 'GET', query: { username: 'safe-user' } }, responseValue);
  assert.equal(responseValue.statusCode, 200);
  assert.match(responseValue.headers['Cache-Control'], /s-maxage=30/);

  clearPublicProfileV2Cache();
  const failed = response();
  const brokenDb = { collection: () => ({ doc: () => ({ get: async () => { throw new Error('backend down'); } }) }) };
  await createPublicV2ProfileHandler({ getDatabase: () => brokenDb })({ method: 'GET', query: { username: 'safe-user' } }, failed);
  assert.equal(failed.statusCode, 503);
});

test('public lyrics route returns only a published track-bound projection', async () => {
  const { publicProfile } = fixture();
  publicProfile.music.tracks = [{
    id: 'track-one',
    source: { type: 'upload', url: 'https://cdn.example/song.mp3', provider: '', embedUrl: '' },
    title: 'Song', artist: 'Artist', album: '', artworkUrl: '', durationMs: 1200,
    lyricsDocumentId: 'lyrics-one',
  }];
  const lyrics = projectPublicLyricsV2({
    schemaVersion: 1, id: 'lyrics-one', ownerUid: 'owner-a', trackId: 'track-one',
    revision: 2, timingMode: 'line', offsetMs: 250, language: 'en',
    stanzas: [{ id: 'verse', order: 0, label: '', lines: [{ id: 'line', text: 'Hello', startMs: 0, endMs: 1100, words: [], legacy: { secret: 'hidden' } }] }],
    display: { align: 'center', privateState: 'hidden' }, legacy: { secret: 'hidden' }, updatedAtMs: 2_000,
  });
  const db = new FakeDatabase({
    'profileV2Public/safe-user': publicProfile,
    'profileV2PublicLyrics/safe-user_track-one': lyrics,
  });
  const handler = createPublicV2LyricsHandler({ getDatabase: () => db });
  const okay = response();
  await handler({ method: 'GET', query: { username: 'safe-user', trackId: 'track-one' } }, okay);
  assert.equal(okay.statusCode, 200);
  assert.equal(okay.body.lyrics.offsetMs, 250);
  assert.doesNotMatch(JSON.stringify(okay.body), /ownerUid|legacy|privateState|secret/);

  const missing = response();
  await handler({ method: 'GET', query: { username: 'safe-user', trackId: 'other-track' } }, missing);
  assert.equal(missing.statusCode, 404);
});
