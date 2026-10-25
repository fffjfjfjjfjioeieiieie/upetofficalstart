import assert from 'node:assert/strict';
import test from 'node:test';
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
    };
    const result = await callback(transaction);
    for (const [path, value] of writes) this.documents.set(path, value);
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

test('trusted repository publishes canonical/public/directory/revision/draft documents atomically', async () => {
  const { draft, track, asset } = fixture();
  const invalidations = [];
  const db = new FakeFirestore({
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

test('trusted repository skips every write and invalidation for unchanged content', async () => {
  const { profile, track, asset } = fixture();
  const published = { ...profile, revision: 4, status: 'published', updatedAtMs: 2_000 };
  const draft = createProfileDraftV2(published, { basePublishedRevision: 4, nowMs: 3_000 });
  const invalidations = [];
  const db = new FakeFirestore({
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

  const missingDb = new FakeFirestore({ [path(PROFILE_V2_COLLECTIONS.drafts, 'owner-a')]: draft });
  await assert.rejects(
    createFirestoreProfileV2Repository({ db: missingDb }).publish({ actor: { uid: 'owner-a' }, username: 'safe-user' }),
    /Missing referenced track/,
  );

  const otherOwnerDb = new FakeFirestore({
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
  const oversizedDb = new FakeFirestore({ [path(PROFILE_V2_COLLECTIONS.drafts, 'owner-a')]: oversized });
  await assert.rejects(
    createFirestoreProfileV2Repository({ db: oversizedDb }).publish({ actor: { uid: 'owner-a' }, username: 'safe-user' }),
    /too many tracks/i,
  );
});
