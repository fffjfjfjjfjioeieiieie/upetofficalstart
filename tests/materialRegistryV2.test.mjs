import assert from 'node:assert/strict';
import test from 'node:test';
import { MATERIAL_VARIANTS, normalizeMaterialVariant } from '../src/graphics/materials/materialRegistry.js';

test('material choices have stable unique IDs and untrusted names fall back to matte', () => {
  const ids = MATERIAL_VARIANTS.map((variant) => variant.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, ['matte', 'crystal', 'frosted', 'chrome', 'holographic']);
  assert.equal(normalizeMaterialVariant('chrome'), 'chrome');
  assert.equal(normalizeMaterialVariant('javascript:evil()'), 'matte');
});
