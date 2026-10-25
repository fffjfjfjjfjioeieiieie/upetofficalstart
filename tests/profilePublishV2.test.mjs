import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyProfileDocumentV2,
  createProfileDraftV2,
  mediaAssetV2Schema,
  musicTrackV2Schema,
  publicProfileProjectionV2Schema,
} from '../src/shared/contracts/index.js';
import { prepareLegacyProfileMigration } from '../src/shared/contracts/legacyProfileAdapter.js';
import { flatLegacyProfile } from './fixtures/profileContracts.mjs';
import {
  assertProfileOwner,
  hasTrustedRole,
  trustedRolesFromClaims,
} from '../server/v2/authClaims.js';
import {
  prepareProfilePublishV2,
  ProfileRevisionConflictError,
} from '../server/v2/profilePublish.js';
import {
  createPublicRequestCache,
  PUBLIC_PROFILE_CACHE_TTL_MS,
} from '../server/v2/publicRequestCache.js';
import { boundedQueryLimit, queryPage } from '../server/v2/queryPolicy.js';

const nowMs = 10_000;

function nativeFixture() {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner-a', username: 'safe-user', nowMs });
  profile.identity.displayName = 'Safe User';
  profile.identity.bio = 'Public biography';
  profile.pages[0].blocks.push({
    id: 'website',
    type: 'link',
    order: 0,
    visible: true,
    layout: { desktop: { x: 0, y: 0, width: 100, height: 0, rotation: 0 } },
    data: {
      label: 'Website',
      url: 'https://example.com',
      platform: 'website',
      secretToken: 'must-not-project',
    },
    style: { radius: 12, privateStyleState: 'must-not-project' },
    accessibility: { label: 'Open website', description: '', decorative: false },
    editorOnlyState: { selected: true },
  });
  profile.theme = {
    colors: { accent: '#6cc4ff', text: '#ffffff', secretThemeToken: 'must-not-project' },
    layout: 'focus',
    editorSession: { ownerUid: 'owner-a' },
  };
  profile.music = { trackIds: ['track-one'], playlistIds: [], defaultTrackId: 'track-one' };
  profile.mediaAssetIds = ['asset-one'];
  profile.futurePrivateField = { apiKey: 'must-not-project' };

  const track = musicTrackV2Schema.parse({
    schemaVersion: 1,
    id: 'track-one',
    ownerUid: 'owner-a',
    source: { type: 'upload', assetId: 'asset-one', url: 'https://cdn.example/track.mp3', provider: '', embedUrl: '' },
    title: 'Original track',
    artist: 'Fixture Artist',
    album: '',
    artworkAssetId: '',
    artworkUrl: '',
    durationMs: 120_000,
    rightsConfirmed: true,
    lyricsDocumentId: 'track-one-lyrics',
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
    privateModerationNote: 'must-not-project',
  });
  const asset = mediaAssetV2Schema.parse({
    schemaVersion: 1,
    id: 'asset-one',
    ownerUid: 'owner-a',
    kind: 'audio',
    provider: 'r2',
    key: 'owner-a/private-storage-key',
    url: 'https://cdn.example/track.mp3',
    mimeType: 'audio/mpeg',
    sizeBytes: 42_000,
    width: null,
    height: null,
    durationMs: 120_000,
    lifecycle: 'active',
    provenance: { type: 'original', rightsConfirmed: true, note: 'private evidence' },
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
  });

  return { profile, track, asset };
}

const containsForbiddenKey = (value, forbidden) => {
  if (Array.isArray(value)) return value.some((item) => containsForbiddenKey(item, forbidden));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, entry]) => forbidden.has(key) || containsForbiddenKey(entry, forbidden));
};

test('publish creates strict public/directory projections without canonical private fields', () => {
  const { profile, track, asset } = nativeFixture();
  const draft = createProfileDraftV2(profile, { basePublishedRevision: 0, nowMs });
  const result = prepareProfilePublishV2({
    actor: { uid: 'owner-a', email: 'ignored@example.com' },
    draft,
    tracks: [track],
    assets: [asset],
    nowMs: 11_000,
  });

  assert.equal(result.changed, true);
  assert.equal(result.revision, 1);
  assert.equal(result.publicProjection.pages[0].blocks[0].data.label, 'Website');
  assert.equal('secretToken' in result.publicProjection.pages[0].blocks[0].data, false);
  assert.equal('privateStyleState' in result.publicProjection.pages[0].blocks[0].style, false);
  assert.equal('secretThemeToken' in result.publicProjection.theme.colors, false);
  assert.equal(result.publicProjection.music.tracks[0].title, 'Original track');
  assert.equal(result.publicProjection.media[0].url, 'https://cdn.example/track.mp3');
  assert.equal(containsForbiddenKey(result.publicProjection, new Set([
    'ownerUid',
    'compatibility',
    'legacySnapshot',
    'key',
    'provenance',
    'rightsConfirmed',
    'privateModerationNote',
  ])), false);
  assert.equal(result.directoryProjection.username, 'safe-user');
  assert.equal(result.directoryProjection.accent, '#6cc4ff');
  assert.doesNotThrow(() => publicProfileProjectionV2Schema.parse(result.publicProjection));
  assert.throws(() => publicProfileProjectionV2Schema.parse({ ...result.publicProjection, ownerUid: 'owner-a' }));
});

test('publish enforces ownership, track ownership and base revisions', () => {
  const { profile, track, asset } = nativeFixture();
  const draft = createProfileDraftV2(profile, { basePublishedRevision: 0, nowMs });

  assert.throws(() => prepareProfilePublishV2({ actor: { uid: 'other' }, draft, tracks: [track], assets: [asset] }), /profile owner/i);
  assert.throws(() => prepareProfilePublishV2({ actor: { uid: 'owner-a' }, draft, tracks: [{ ...track, ownerUid: 'other' }], assets: [asset] }), /another owner's track/i);
  assert.throws(() => prepareProfilePublishV2({ actor: { uid: 'owner-a' }, draft, tracks: [], assets: [asset] }), /Missing referenced track/);
  assert.throws(() => prepareProfilePublishV2({ actor: { uid: 'owner-a' }, draft, tracks: [track], assets: [] }), /Missing referenced asset/);

  const first = prepareProfilePublishV2({ actor: { uid: 'owner-a' }, draft, tracks: [track], assets: [asset], nowMs: 11_000 });
  assert.throws(
    () => prepareProfilePublishV2({ actor: { uid: 'owner-a' }, currentProfile: first.published, draft, tracks: [track], assets: [asset] }),
    ProfileRevisionConflictError,
  );
});

test('publish skips unchanged documents and advances changed revisions once', () => {
  const { profile, track, asset } = nativeFixture();
  const first = prepareProfilePublishV2({
    actor: { uid: 'owner-a' },
    draft: createProfileDraftV2(profile, { basePublishedRevision: 0, nowMs }),
    tracks: [track],
    assets: [asset],
    nowMs: 11_000,
  });
  const unchangedDraft = createProfileDraftV2(first.published, { basePublishedRevision: 1, nowMs: 12_000 });
  const unchanged = prepareProfilePublishV2({
    actor: { uid: 'owner-a' }, currentProfile: first.published, draft: unchangedDraft, tracks: [track], assets: [asset], nowMs: 13_000,
  });
  assert.deepEqual(unchanged, { changed: false, revision: 1 });

  unchangedDraft.profile.identity.bio = 'Changed biography';
  const changed = prepareProfilePublishV2({
    actor: { uid: 'owner-a' }, currentProfile: first.published, draft: unchangedDraft, tracks: [track], assets: [asset], nowMs: 14_000,
  });
  assert.equal(changed.revision, 2);
  assert.equal(changed.publicProjection.identity.bio, 'Changed biography');
  assert.equal(changed.revisionSnapshot.revision, 2);
});

test('legacy migration bundles cannot enter the v2 publish path', () => {
  const legacy = prepareLegacyProfileMigration(flatLegacyProfile, { nowMs });
  const draft = createProfileDraftV2(legacy.profile, { basePublishedRevision: 0, nowMs });
  assert.throws(
    () => prepareProfilePublishV2({ actor: { uid: legacy.profile.ownerUid }, draft }),
    /writes are blocked/i,
  );
});

test('trusted roles come only from claims and do not replace profile ownership', () => {
  assert.deepEqual(trustedRolesFromClaims({ roles: ['moderator', 'unknown'], founder: true }), ['moderator', 'founder']);
  assert.equal(hasTrustedRole({ uid: 'staff', email: 'founder@example.com', claims: {} }, 'founder'), false);
  assert.equal(hasTrustedRole({ uid: 'staff', claims: { roles: ['support'] } }, 'support'), true);
  assert.throws(() => assertProfileOwner({ uid: 'staff', claims: { founder: true } }, { ownerUid: 'owner' }), /profile owner/i);
});

test('public request cache deduplicates reads, expires explicitly and propagates failures', async () => {
  let clock = 1_000;
  let loads = 0;
  const cache = createPublicRequestCache({ ttlMs: 50, maxEntries: 2, now: () => clock });
  const loader = async () => ({ load: ++loads });
  const [first, shared] = await Promise.all([cache.get('safe-user', loader), cache.get('safe-user', loader)]);
  assert.deepEqual(first, { load: 1 });
  assert.deepEqual(shared, { load: 1 });
  assert.equal(loads, 1);

  clock += 51;
  assert.deepEqual(await cache.get('safe-user', loader), { load: 2 });
  await assert.rejects(cache.get('failure', async () => { throw new Error('backend unavailable'); }), /backend unavailable/);
  assert.equal(cache.size, 1);
  assert.equal(PUBLIC_PROFILE_CACHE_TTL_MS, 30_000);
});

test('query policies always produce bounded page sizes and cursors', () => {
  assert.equal(boundedQueryLimit('directory'), 24);
  assert.equal(boundedQueryLimit('messages', 10_000), 100);
  assert.equal(boundedQueryLimit('supportTickets', -5), 1);
  assert.deepEqual(queryPage('conversations', { limit: 45, cursor: 123 }), { limit: 45, cursor: '123' });
  assert.throws(() => boundedQueryLimit('unknown'), /Unknown query resource/);
});
