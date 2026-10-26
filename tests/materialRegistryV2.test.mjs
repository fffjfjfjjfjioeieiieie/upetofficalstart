import assert from 'node:assert/strict';
import test from 'node:test';
import { assertProfileMaterialConfigs, createMaterialConfig, isGlassMaterial, materialConfigSchema, MATERIAL_VARIANTS, normalizeMaterialConfig, normalizeMaterialVariant } from '../src/graphics/materials/materialRegistry.js';
import { createEmptyProfileDocumentV2 } from '../src/shared/contracts/profileV2.js';
import { createPublicProfileProjectionV2 } from '../src/shared/contracts/publicProfileV2.js';
import { createStudioBlock } from '../src/features/studio/v2/studioDocumentOps.js';

test('material choices have stable unique IDs and untrusted names fall back to matte', () => {
  const ids = MATERIAL_VARIANTS.map((variant) => variant.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, ['matte', 'crystal', 'frosted', 'smoked-glass', 'tinted-glass', 'chrome', 'brushed-steel', 'gold', 'rose-gold', 'dark-metal', 'liquid-metal', 'holographic']);
  assert.equal(normalizeMaterialVariant('chrome'), 'chrome');
  assert.equal(normalizeMaterialVariant('javascript:evil()'), 'matte');
});

test('metal defaults are physically distinct and brush controls stay bounded', () => {
  const metals = ['chrome', 'brushed-steel', 'gold', 'rose-gold', 'dark-metal'].map(createMaterialConfig);
  assert.equal(new Set(metals.map((material) => material.tint)).size, metals.length);
  assert.ok(metals[1].roughness > metals[0].roughness);
  assert.throws(() => materialConfigSchema.parse({ id: 'brushed-steel', brushStrength: 20 }));
  assert.throws(() => materialConfigSchema.parse({ id: 'brushed-steel', brushDirection: 999 }));
});

test('DOM glass has distinct diffusion/absorption defaults and bounded rim/grain controls', () => {
  const clear = createMaterialConfig('crystal');
  const frosted = createMaterialConfig('frosted');
  const smoked = createMaterialConfig('smoked-glass');
  const tinted = createMaterialConfig('tinted-glass');
  assert.equal(clear.grain, 0);
  assert.ok(frosted.blur > clear.blur);
  assert.ok(smoked.opacity > clear.opacity);
  assert.notEqual(tinted.tint, smoked.tint);
  assert.ok([clear, frosted, smoked, tinted].every((material) => isGlassMaterial(material.id)));
  assert.throws(() => materialConfigSchema.parse({ id: 'crystal', edgeWidth: 100 }));
  assert.throws(() => materialConfigSchema.parse({ id: 'crystal', edgeDepth: -1 }));
  assert.throws(() => materialConfigSchema.parse({ id: 'frosted', grain: Infinity }));
});

test('liquid metal limits wave geometry and permits an explicit stopped flow', () => {
  const material = createMaterialConfig('liquid-metal');
  assert.ok(material.waveAmplitude > 0 && material.waveAmplitude <= .12);
  assert.doesNotThrow(() => materialConfigSchema.parse({ ...material, flowSpeed: 0 }));
  assert.throws(() => materialConfigSchema.parse({ ...material, waveAmplitude: 1 }));
  assert.throws(() => materialConfigSchema.parse({ ...material, waveFrequency: 1000 }));
  assert.throws(() => materialConfigSchema.parse({ ...material, flowSpeed: Infinity }));
});

test('ID-only materials resolve to identical family defaults in owner and published views', () => {
  for (const { id } of MATERIAL_VARIANTS) {
    const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner', username: 'family-defaults', nowMs: 1 });
    profile.status = 'published';
    profile.theme.material = { id };
    assert.deepEqual(createPublicProfileProjectionV2(profile).theme.material, normalizeMaterialConfig({ id }), id);
  }
});

test('material controls reject dangerous/unsupported writes and safely normalize untrusted reads', () => {
  assert.throws(() => materialConfigSchema.parse({ id: 'chrome', roughness: -1 }));
  assert.throws(() => materialConfigSchema.parse({ id: 'chrome', tint: 'url(javascript:evil)' }));
  assert.throws(() => materialConfigSchema.parse({ id: 'injected-shader' }));
  assert.throws(() => materialConfigSchema.parse({ id: 'chrome', reflection: Infinity }));
  const fallback = normalizeMaterialConfig(JSON.parse('{"id":"chrome","constructor":"evil","roughness":-1,"tint":"red","shader":"discard"}'));
  assert.equal(fallback.id, 'chrome');
  assert.equal(fallback.roughness, .2);
  assert.equal(fallback.tint, '#c9d5df');
  assert.equal(Object.hasOwn(fallback, 'shader'), false);
});

test('theme and per-layer material controls survive public projection without private extensions', () => {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner', username: 'materials', nowMs: 1 });
  profile.status = 'published';
  profile.theme.material = { ...createMaterialConfig('chrome'), roughness: .4, privateExtension: 'never public' };
  const block = createStudioBlock('heading', { id: 'heading' });
  block.style.material = { ...createMaterialConfig('crystal'), blur: 25, privateExtension: 'never public' };
  profile.pages[0].blocks.push(block);
  assert.doesNotThrow(() => assertProfileMaterialConfigs(profile));
  const projected = createPublicProfileProjectionV2(profile);
  assert.equal(projected.theme.material.roughness, .4);
  assert.equal(projected.pages[0].blocks[0].style.material.blur, 25);
  assert.equal(JSON.stringify(projected).includes('privateExtension'), false);
  block.style.material.radius = 1000;
  assert.throws(() => assertProfileMaterialConfigs(profile));
});
