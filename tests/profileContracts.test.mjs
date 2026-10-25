import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertProfileDocumentV2Writable,
  lyricsToLegacyLines,
  prepareLegacyProfileMigration,
  restoreLegacyProfileSource,
} from '../src/shared/contracts/legacyProfileAdapter.js';
import {
  createEmptyProfileDocumentV2,
  createProfileDraftV2,
  legacyProfileMigrationBundleSchema,
  profileDocumentV2Schema,
} from '../src/shared/contracts/profileV2.js';
import {
  flatLegacyProfile,
  profileContractFixtures,
  redesignPublicEnvelope,
  schemaV1PublicEnvelope,
} from './fixtures/profileContracts.mjs';

test('every supported legacy fixture has a lossless, detached rollback snapshot', () => {
  for (const [name, fixture] of profileContractFixtures) {
    const bundle = prepareLegacyProfileMigration(fixture, { nowMs: 1_000 });
    assert.doesNotThrow(() => legacyProfileMigrationBundleSchema.parse(bundle), name);
    assert.deepEqual(restoreLegacyProfileSource(bundle), fixture, name);

    const restored = restoreLegacyProfileSource(bundle);
    restored.rollbackMutation = true;
    assert.equal('rollbackMutation' in fixture, false, `${name} should return a detached clone`);
  }
});

test('legacy migration classifies each source without enabling writes', () => {
  const flat = prepareLegacyProfileMigration(flatLegacyProfile, { nowMs: 1_000 });
  const v1 = prepareLegacyProfileMigration(schemaV1PublicEnvelope, { nowMs: 1_000 });
  const redesign = prepareLegacyProfileMigration(redesignPublicEnvelope, { nowMs: 1_000 });

  assert.equal(flat.profile.compatibility.source, 'legacy-flat');
  assert.equal(v1.profile.compatibility.source, 'legacy-v1');
  assert.equal(redesign.profile.compatibility.source, 'legacy-redesign');
  for (const bundle of [flat, v1, redesign]) {
    assert.equal(bundle.profile.compatibility.writeMode, 'blocked-until-roundtrip');
    assert.throws(() => assertProfileDocumentV2Writable(bundle.profile), /writes are blocked/i);
  }
});

test('legacy blocks and unknown block fields remain reachable in the v2 page model', () => {
  const { profile } = prepareLegacyProfileMigration(schemaV1PublicEnvelope, { nowMs: 1_000 });
  const page = profile.pages[0];

  assert.equal(page.slug, '');
  assert.equal(page.blocks[0].type, 'identity');
  assert.equal(page.blocks[1].id, 'heading-one');
  assert.equal(page.blocks[1].legacy.unknownBlockField.retain, true);
  assert.deepEqual(page.blocks[2].data.assets, ['/fixtures/one.jpg', '/fixtures/two.jpg']);
  assert.equal(profile.theme.legacy.futureMaterial.shader, 'fixture-only');
});

test('legacy audio becomes a bounded music library without losing its source metadata', () => {
  const flat = prepareLegacyProfileMigration(flatLegacyProfile, { nowMs: 1_000 });
  assert.equal(flat.tracks.length, 1);
  assert.equal(flat.profile.music.defaultTrackId, flat.tracks[0].id);
  assert.equal(flat.tracks[0].source.url, '/fixtures/original-demo.mp3');
  assert.equal(flat.tracks[0].rightsConfirmed, false);

  const v1 = prepareLegacyProfileMigration(schemaV1PublicEnvelope, { nowMs: 1_000 });
  assert.equal(v1.tracks.length, 2);
  assert.equal(v1.tracks[0].legacy.waveformCache[1], 0.2);
  assert.deepEqual(v1.profile.music.trackIds, ['track-a', 'track-b']);
});

test('current line lyrics become track-bound millisecond documents and round-trip line metadata', () => {
  const bundle = prepareLegacyProfileMigration(redesignPublicEnvelope, { nowMs: 1_000 });
  assert.equal(bundle.tracks.length, 1);
  assert.equal(bundle.lyrics.length, 1);
  assert.equal(bundle.tracks[0].lyricsDocumentId, bundle.lyrics[0].id);
  assert.equal(bundle.lyrics[0].trackId, bundle.tracks[0].id);
  assert.equal(bundle.lyrics[0].timingMode, 'line');
  assert.equal(bundle.lyrics[0].offsetMs, -250);
  assert.equal(bundle.lyrics[0].stanzas[0].lines[0].startMs, 1_250);
  assert.equal(bundle.lyrics[0].stanzas[0].lines[0].endMs, 3_500);
  assert.equal(bundle.lyrics[0].stanzas[0].lines[1].startMs, null);

  const restoredLines = lyricsToLegacyLines(bundle.lyrics[0]);
  assert.equal(restoredLines[0].time, 1.25);
  assert.equal(restoredLines[0].endTime, 3.5);
  assert.equal(restoredLines[0].speaker, 'A');
  assert.equal(restoredLines[1].synced, false);
  assert.equal(restoredLines[1].annotation, 'keep');
});

test('native v2 profiles allow drafts while preserving unknown future fields', () => {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner', username: 'future-user', nowMs: 2_000 });
  profile.futureRoot = { enabled: true };
  profile.identity.futureIdentity = 'preserve';
  profile.pages[0].futurePage = ['keep'];

  const parsed = profileDocumentV2Schema.parse(profile);
  assert.deepEqual(parsed.futureRoot, { enabled: true });
  assert.equal(parsed.identity.futureIdentity, 'preserve');
  assert.deepEqual(parsed.pages[0].futurePage, ['keep']);
  assert.doesNotThrow(() => assertProfileDocumentV2Writable(parsed));

  const draft = createProfileDraftV2(parsed, { basePublishedRevision: 4, draftRevision: 2, nowMs: 3_000 });
  assert.equal(draft.profile.status, 'draft');
  assert.equal(draft.basePublishedRevision, 4);
  assert.equal(draft.draftRevision, 2);
});

test('draft contracts reject owner and username mismatches', () => {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner', username: 'safe-user', nowMs: 2_000 });
  const draft = createProfileDraftV2(profile, { nowMs: 3_000 });

  assert.throws(() => createProfileDraftV2({ ...profile, username: 'Bad username!' }), /Invalid string/i);
  assert.equal(draft.ownerUid, draft.profile.ownerUid);
  assert.equal(draft.username, draft.profile.username);
});
