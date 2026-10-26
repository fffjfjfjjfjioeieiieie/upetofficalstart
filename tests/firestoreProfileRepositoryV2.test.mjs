import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import {
  createEmptyProfileDocumentV2,
  createProfileDraftV2,
  mediaAssetV2Schema,
  musicTrackV2Schema,
} from '../src/shared/contracts/index.js';
import {
  createFirestoreProfileV2Repository,
  PROFILE_V2_COLLECTIONS,
  PROFILE_V2_PUBLISH_LIMITS,
} from '../server/v2/firestoreProfileRepository.js';
import { ProfileRevisionConflictError } from '../server/v2/profilePublish.js';

class FakeSnapshot {
  constructor(value) {
    this.value = value;
    this.exists = value !== undefined;
  }

  data() {
    return structuredClone(this.value);
  }
}

class FakeFirestore {
  constructor(entries = {}) {
    this.documents = new Map(Object.entries(structuredClone(entries)));
    this.writeBatches = [];
  }

  doc(path) {
    return Object.freeze({ path });
  }

  async runTransaction(callback) {
    const writes = [];
    const transaction = {
      get: async (reference) => new FakeSnapshot(this.documents.get(reference.path)),
      set: (reference, value) => writes.push([reference.path, structuredClone(value)]),
      delete: (reference) => writes.push([reference.path, undefined]),
    };
    const result = await callback(transaction);
    for (const [path, value] of writes) {
      if (value === undefined) this.documents.delete(path);
      else this.documents.set(path, value);
    }
    this.writeBatches.push(writes);
    return result;
  }
}

function fixture() {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner-a', username: 'safe-user', nowMs: 1_000 });
  profile.music = { trackIds: ['track-one'], playlistIds: [], defaultTrackId: 'track-one' };
  profile.mediaAssetIds = ['asset-one'];
  const draft = createProfileDraftV2(profile, { basePublishedRevision: 0, nowMs: 1_000 });
  const track = musicTrackV2Schema.parse({
    schemaVersion: 1,
    id: 'track-one',
    ownerUid: 'owner-a',
    source: { type: 'upload', assetId: 'asset-one', url: 'https://cdn.example/track.mp3', provider: '', embedUrl: '' },
    title: 'Track',
    artist: 'Artist',
    album: '',
    artworkAssetId: '',
    artworkUrl: '',
    durationMs: 60_000,
    rightsConfirmed: true,
    lyricsDocumentId: '',
    createdAtMs: 1_000,
    updatedAtMs: 1_000,
  });
  const asset = mediaAssetV2Schema.parse({
    schemaVersion: 1,
    id: 'asset-one',
    ownerUid: 'owner-a',
    kind: 'audio',
    provider: 'r2',
    key: 'owner-a/track.mp3',
    url: 'https://cdn.example/track.mp3',
    mimeType: 'audio/mpeg',
    sizeBytes: 1_000,
    width: null,
    height: null,
    durationMs: 60_000,
    lifecycle: 'active',
    provenance: { type: 'original', rightsConfirmed: true, note: '' },
    createdAtMs: 1_000,
    updatedAtMs: 1_000,
  });
  return { profile, draft, track, asset };
}

const path = (collection, id) => `${collection}/${id}`;
const ownership = {
  'usernames/safe-user': { uid: 'owner-a', username: 'safe-user' },
  'users/owner-a': { uid: 'owner-a', username: 'safe-user' },
};

test('trusted repository publishes canonical/public/directory/revision/draft documents atomically', async () => {
  const { draft, track, asset } = fixture();
  const invalidations = [];
  const db = new FakeFirestore({
    ...ownership,
    [path(PROFILE_V2_COLLECTIONS.drafts, 'owner-a')]: draft,
    [path(PROFILE_V2_COLLECTIONS.tracks, 'track-one')]: track,
    [path(PROFILE_V2_COLLECTIONS.assets, 'asset-one')]: asset,
  });
  const repository = createFirestoreProfileV2Repository({
    db,
    now: () => 2_000,
    invalidatePublicProfile: async (username) => invalidations.push(username),
  });

  const result = await repository.publish({ actor: { uid: 'owner-a' }, username: 'safe-user' });
  assert.equal(result.changed, true);
  assert.equal(result.revision, 1);
  assert.equal(db.writeBatches[0].length, 5);
  assert.equal(db.documents.get(path(PROFILE_V2_COLLECTIONS.canonical, 'safe-user')).revision, 1);
  assert.equal(db.documents.get(path(PROFILE_V2_COLLECTIONS.public, 'safe-user')).username, 'safe-user');
  assert.equal(db.documents.get(path(PROFILE_V2_COLLECTIONS.directory, 'safe-user')).revision, 1);
  assert.equal(db.documents.get(path(PROFILE_V2_COLLECTIONS.revisions, 'safe-user_1')).revision, 1);
  assert.equal(db.documents.get(path(PROFILE_V2_COLLECTIONS.drafts, 'owner-a')).basePublishedRevision, 1);
  assert.deepEqual(invalidations, ['safe-user']);
});

test('draft saves are owner-verified, conflict-safe and do not publish or repeat unchanged writes', async () => {
  const { profile } = fixture();
  const db = new FakeFirestore(ownership);
  const repository = createFirestoreProfileV2Repository({ db, now: () => 2_000 });
  const request = { actor: { uid: 'owner-a' }, username: 'safe-user', profile, basePublishedRevision: 0, expectedDraftRevision: 0 };
  assert.deepEqual(await repository.saveDraft(request), { changed: true, draftRevision: 1, basePublishedRevision: 0 });
  assert.deepEqual(db.writeBatches[0].map(([name]) => name), ['profileV2Drafts/owner-a']);
  assert.equal(db.documents.has('profileV2Public/safe-user'), false);
  assert.deepEqual(await repository.saveDraft({ ...request, expectedDraftRevision: 1 }), { changed: false, draftRevision: 1, basePublishedRevision: 0 });
  assert.equal(db.writeBatches[1].length, 0);
  await assert.rejects(repository.saveDraft(request), ProfileRevisionConflictError);
  await assert.rejects(repository.saveDraft({ ...request, actor: { uid: 'owner-b' }, expectedDraftRevision: 1 }), /owner/i);
  await assert.rejects(repository.saveDraft({ ...request, profile: { ...profile, compatibility: { ...profile.compatibility, writeMode: 'blocked-until-roundtrip' } }, expectedDraftRevision: 1 }), /blocked/i);
  assert.equal(db.documents.get('profileV2Drafts/owner-a').draftRevision, 1);
});

test('material writes are validated before draft I/O and preserve public controls through publish', async () => {
  const { profile, track, asset } = fixture();
  const db = new FakeFirestore({
    ...ownership,
    [path(PROFILE_V2_COLLECTIONS.tracks, track.id)]: track,
    [path(PROFILE_V2_COLLECTIONS.assets, asset.id)]: asset,
  });
  const repository = createFirestoreProfileV2Repository({ db, now: () => 2_000 });
  const request = { actor: { uid: 'owner-a' }, username: 'safe-user', basePublishedRevision: 0, expectedDraftRevision: 0 };
  profile.theme.material = { id: 'chrome', roughness: 99 };
  await assert.rejects(repository.saveDraft({ ...request, profile }));
  assert.equal(db.writeBatches.length, 0, 'invalid material cannot start a transaction');
  profile.theme.material = { id: 'chrome', roughness: .4, shader: 'unsupported-code' };
  await assert.rejects(repository.saveDraft({ ...request, profile }), /Executable/);
  assert.equal(db.writeBatches.length, 0);
  profile.theme.material = { id: 'chrome', roughness: .4, privateExtension: 'keep private' };
  await repository.saveDraft({ ...request, profile });
  assert.equal(db.documents.get('profileV2Drafts/owner-a').profile.theme.material.roughness, .4);
  await repository.publish({ actor: request.actor, username: request.username });
  const projected = db.documents.get('profileV2Public/safe-user');
  assert.equal(projected.theme.material.roughness, .4);
  assert.equal(Object.hasOwn(projected.theme.material, 'privateExtension'), false);
});

test('trusted repository skips every write and invalidation for unchanged content', async () => {
  const { profile, track, asset } = fixture();
  const dependenciesSignature = createHash('sha256')
    .update(JSON.stringify({ tracks: [track], assets: [asset], publicLyrics: [] }))
    .digest('hex');
  const published = { ...profile, revision: 4, status: 'published', updatedAtMs: 2_000, dependenciesSignature };
  const draft = createProfileDraftV2(published, { basePublishedRevision: 4, nowMs: 3_000 });
  const invalidations = [];
  const db = new FakeFirestore({
    ...ownership,
    [path(PROFILE_V2_COLLECTIONS.drafts, 'owner-a')]: draft,
    [path(PROFILE_V2_COLLECTIONS.canonical, 'safe-user')]: published,
    [path(PROFILE_V2_COLLECTIONS.tracks, 'track-one')]: track,
    [path(PROFILE_V2_COLLECTIONS.assets, 'asset-one')]: asset,
  });
  const repository = createFirestoreProfileV2Repository({ db, now: () => 4_000, invalidatePublicProfile: async (value) => invalidations.push(value) });

  const result = await repository.publish({ actor: { uid: 'owner-a' }, username: 'safe-user' });
  assert.deepEqual(result, { changed: false, revision: 4 });
  assert.equal(db.writeBatches[0].length, 0);
  assert.deepEqual(invalidations, []);
});

test('trusted repository fails closed for stale, missing, cross-owner and oversized references', async () => {
  const { draft, track, asset } = fixture();
  const current = { ...draft.profile, revision: 2, status: 'published' };
  const staleDb = new FakeFirestore({
    ...ownership,
    [path(PROFILE_V2_COLLECTIONS.drafts, 'owner-a')]: draft,
    [path(PROFILE_V2_COLLECTIONS.canonical, 'safe-user')]: current,
    [path(PROFILE_V2_COLLECTIONS.tracks, 'track-one')]: track,
    [path(PROFILE_V2_COLLECTIONS.assets, 'asset-one')]: asset,
  });
  await assert.rejects(
    createFirestoreProfileV2Repository({ db: staleDb }).publish({ actor: { uid: 'owner-a' }, username: 'safe-user' }),
    ProfileRevisionConflictError,
  );
  assert.equal(staleDb.writeBatches.length, 0);

  const missingDb = new FakeFirestore({ ...ownership, [path(PROFILE_V2_COLLECTIONS.drafts, 'owner-a')]: draft });
  await assert.rejects(
    createFirestoreProfileV2Repository({ db: missingDb }).publish({ actor: { uid: 'owner-a' }, username: 'safe-user' }),
    /Missing referenced track/,
  );

  const otherOwnerDb = new FakeFirestore({
    ...ownership,
    [path(PROFILE_V2_COLLECTIONS.drafts, 'owner-a')]: draft,
    [path(PROFILE_V2_COLLECTIONS.tracks, 'track-one')]: { ...track, ownerUid: 'owner-b' },
    [path(PROFILE_V2_COLLECTIONS.assets, 'asset-one')]: asset,
  });
  await assert.rejects(
    createFirestoreProfileV2Repository({ db: otherOwnerDb }).publish({ actor: { uid: 'owner-a' }, username: 'safe-user' }),
    /another owner's track/i,
  );

  const oversized = structuredClone(draft);
  oversized.profile.music.trackIds = Array.from({ length: PROFILE_V2_PUBLISH_LIMITS.tracks + 1 }, (_, index) => `track-${index}`);
  oversized.profile.music.defaultTrackId = 'track-0';
  const oversizedDb = new FakeFirestore({ ...ownership, [path(PROFILE_V2_COLLECTIONS.drafts, 'owner-a')]: oversized });
  await assert.rejects(
    createFirestoreProfileV2Repository({ db: oversizedDb }).publish({ actor: { uid: 'owner-a' }, username: 'safe-user' }),
    /too many tracks/i,
  );

  const unclaimedDb = new FakeFirestore({
    [path(PROFILE_V2_COLLECTIONS.drafts, 'owner-a')]: draft,
  });
  await assert.rejects(
    createFirestoreProfileV2Repository({ db: unclaimedDb }).publish({ actor: { uid: 'owner-a' }, username: 'safe-user' }),
    /not claimed/i,
  );
});

test('published lyrics are immutable allowlisted copies and dependency edits create a new revision', async () => {
  const { draft, track, asset } = fixture();
  const lyrics = {
    schemaVersion: 1,
    id: 'track-one-lyrics',
    ownerUid: 'owner-a',
    trackId: 'track-one',
    revision: 1,
    timingMode: 'line',
    offsetMs: 0,
    language: 'en',
    stanzas: [{ id: 'verse', order: 0, label: '', lines: [{ id: 'line-one', text: 'Hello', startMs: 0, endMs: 1200, words: [], privateNote: 'keep private' }] }],
    display: { align: 'center', privatePalette: 'keep private' },
    legacy: { hiddenDraft: 'keep private' },
    updatedAtMs: 1000,
  };
  const db = new FakeFirestore({
    ...ownership,
    'profileV2Drafts/owner-a': draft,
    'profileV2Tracks/track-one': { ...track, lyricsDocumentId: lyrics.id },
    'profileV2Assets/asset-one': asset,
    'profileV2Lyrics/track-one-lyrics': lyrics,
  });
  const repository = createFirestoreProfileV2Repository({ db, now: () => 2000 });
  const first = await repository.publish({ actor: { uid: 'owner-a' }, username: 'safe-user' });
  assert.equal(first.revision, 1);
  assert.equal(db.documents.get('profileV2PublicLyrics/safe-user_track-one').stanzas[0].lines[0].text, 'Hello');
  assert.doesNotMatch(JSON.stringify(db.documents.get('profileV2PublicLyrics/safe-user_track-one')), /privateNote|hiddenDraft|privatePalette|ownerUid/);

  const changedLyrics = { ...lyrics, revision: 2, stanzas: [{ ...lyrics.stanzas[0], lines: [{ ...lyrics.stanzas[0].lines[0], text: 'Hello again' }] }] };
  db.documents.set('profileV2Lyrics/track-one-lyrics', changedLyrics);
  const second = await repository.publish({ actor: { uid: 'owner-a' }, username: 'safe-user' });
  assert.equal(second.revision, 2);
  assert.equal(db.documents.get('profileV2PublicLyrics/safe-user_track-one').stanzas[0].lines[0].text, 'Hello again');

  db.documents.set('profileV2Tracks/track-one', { ...track, lyricsDocumentId: '' });
  const third = await repository.publish({ actor: { uid: 'owner-a' }, username: 'safe-user' });
  assert.equal(third.revision, 3);
  assert.equal(db.documents.has('profileV2PublicLyrics/safe-user_track-one'), false);
});
