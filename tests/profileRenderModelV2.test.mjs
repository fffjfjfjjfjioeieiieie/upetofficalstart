import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyProfileDocumentV2 } from '../src/shared/contracts/profileV2.js';
import { createPublicProfileProjectionV2 } from '../src/shared/contracts/publicProfileV2.js';
import { prepareLegacyProfileMigration } from '../src/shared/contracts/legacyProfileAdapter.js';
import { getBlockLayout, getBlockRenderStyle, getRenderablePage, isRenderableBlockType, resolveProfileRenderSource } from '../src/features/profiles/renderer/profileRenderModel.js';
import { profileContractFixtures } from './fixtures/profileContracts.mjs';

function fixtureProfile() {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner', username: 'artist', nowMs: 1 });
  profile.status = 'published';
  profile.identity.displayName = 'Artist';
  profile.pages[0].blocks = [
    { id: 'later', type: 'text', order: 2, visible: true, layout: { desktop: { x: 5, y: 30, width: 80, height: 40, rotation: 0 } }, data: { text: 'After' }, style: {}, accessibility: { label: '', description: '', decorative: false } },
    { id: 'hidden', type: 'text', order: 1, visible: false, layout: { desktop: { x: 5, y: 0, width: 80, height: 40, rotation: 0 } }, data: { text: 'Private' }, style: {}, accessibility: { label: '', description: '', decorative: false } },
    { id: 'first', type: 'heading', order: 0, visible: true, layout: { desktop: { x: 5, y: 0, width: 80, height: 40, rotation: 0 }, mobile: { x: 0, y: 10, width: 100, height: 50, rotation: 0 } }, data: { text: 'First' }, style: {}, accessibility: { label: '', description: '', decorative: false } },
  ];
  return profile;
}

test('all supported legacy source shapes stay on the existing renderer without mutation', () => {
  for (const [name, source] of profileContractFixtures) {
    const before = structuredClone(source);
    const resolved = resolveProfileRenderSource(source);
    assert.equal(resolved.kind, 'legacy', name);
    assert.equal(resolved.source, source, name);
    assert.deepEqual(source, before, name);
    assert.equal(prepareLegacyProfileMigration(source).profile.schemaVersion, 2, name);
  }
  assert.equal(resolveProfileRenderSource({ ...profileContractFixtures[0][1], schemaVersion: 0 }).kind, 'legacy');
});

test('public renderer accepts only strict projections, not owner-private canonical data', () => {
  const profile = fixtureProfile();
  const projection = createPublicProfileProjectionV2(profile);
  assert.equal(resolveProfileRenderSource(projection).kind, 'v2');
  assert.throws(() => resolveProfileRenderSource(profile), /unrecognized|invalid|expected/i);
  assert.equal(resolveProfileRenderSource(profile, { audience: 'owner' }).kind, 'v2');
});

test('pages and blocks have deterministic order, visibility, and responsive fallback', () => {
  const profile = fixtureProfile();
  const page = getRenderablePage(profile);
  assert.deepEqual(page.blocks.map((block) => block.id), ['first', 'later']);
  assert.equal(getBlockLayout(page.blocks[0], 'mobile').y, 10);
  assert.equal(getBlockLayout(page.blocks[1], 'mobile').y, 30);
  assert.equal(getRenderablePage(profile, 'missing'), null);
  assert.equal(isRenderableBlockType('heading'), true);
  assert.equal(isRenderableBlockType('custom-script'), false);
  page.blocks[0].layout.desktop.y = 2400;
  assert.equal(getBlockRenderStyle(page.blocks[0]).top, 2400, 'long pages must not collapse later blocks onto one coordinate');
  profile.pages[0].visible = false;
  assert.equal(getRenderablePage(profile), null);
  assert.ok(getRenderablePage(profile, '', 'owner'));
  assert.throws(() => resolveProfileRenderSource({ schemaVersion: 99 }), /Unsupported/);
});
