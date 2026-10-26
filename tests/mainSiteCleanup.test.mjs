import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { documentFromRedesign, redesignFromDocument, sanitizeRedesignProfile } from '../src/redesign/lib/profileModel.js';
import { hasTrustedRole, trustedRolesFromClaims } from '../server/authClaims.js';

test('retired Studio v2 and commerce implementations are absent', () => {
  for (const path of ['UPET_MASTERPLAN.md', 'src/graphics/materials/physicalSurfaceScene.js', 'src/features/studio/v2/StudioV2.jsx', 'src/redesign/shop/ShopHost.jsx', 'api/v2-profile.js', 'api/shop-stripe.js', 'api/shop-data.js', 'server/shopCommerce.js']) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), false, path);
  }
  const packages = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(packages.dependencies.three, undefined);
  assert.equal(packages.dependencies.stripe, undefined);
});

test('editing a main-site profile preserves complete retired commerce metadata', () => {
  const shop = { enabled: true, connected: true, name: 'Historical store', design: { custom: 'unchanged' }, products: [{ id: 'legacy-product', price: '12.99', delivery: { fileId: 'existing-file' } }], unknownFutureField: ['keep'] };
  const profile = sanitizeRedesignProfile({ displayName: 'Updated name', shop }, 'example');
  const restored = redesignFromDocument(documentFromRedesign(profile, 'owner', 'example'), 'example');
  assert.deepEqual(restored.shop, shop);
  assert.equal(restored.displayName, 'Updated name');
  assert.equal(sanitizeRedesignProfile({}, 'example').shop.enabled, false);
});

test('main-site authorization still uses trusted role claims', () => {
  assert.equal(hasTrustedRole({ uid: 'owner', claims: { roles: ['founder'] } }, 'founder'), true);
  assert.equal(hasTrustedRole({ uid: 'owner', claims: { founder: true } }, 'founder'), true);
  assert.equal(hasTrustedRole({ uid: 'agent', claims: { roles: ['support'] } }, 'founder'), false);
  assert.equal(hasTrustedRole({ claims: { founder: true } }, 'founder'), false);
  assert.deepEqual(trustedRolesFromClaims({ roles: ['unknown'] }), []);
});

test('main navigation no longer links to storefronts or the experimental Studio', () => {
  for (const path of ['src/redesign/components/Header.jsx', 'src/redesign/components/Footer.jsx', 'src/redesign/pages/Home.jsx']) {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /(?:to|href)=["']\/(?:marketplace|shop|dashboard\/(?:shop|studio-v2|premium))/);
  }
});
