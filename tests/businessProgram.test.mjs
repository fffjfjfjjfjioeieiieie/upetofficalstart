import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanBusinessApplication } from '../src/shared/businessApplication.js';

const input = { businessName: '  Bright Goods  ', category: 'physical', businessType: 'registered', country: 'United Kingdom', website: 'https://example.com/shop', shopUrl: 'https://user.pet/bright/shop', publicProofUrl: 'https://example.com/about', proofExplanation: 'The about page names Bright Goods and links directly to our shop.', ownerRole: 'owner', supportEmail: 'Help@Example.com', fulfillment: 'We ship physical items within three working days.', description: 'We make small-batch stationery and ship from London.' };

test('business applications collect usable identity, shop, and public proof details', () => {
  const result = cleanBusinessApplication(input, 'bright');
  assert.equal(result.businessName, 'Bright Goods');
  assert.equal(result.supportEmail, 'help@example.com');
  assert.equal(result.shopUrl, 'https://user.pet/bright/shop');
  assert.throws(() => cleanBusinessApplication({ ...input, website: 'javascript:alert(1)' }, 'bright'), /valid http or https/i);
  assert.throws(() => cleanBusinessApplication({ ...input, shopUrl: 'https://user.pet/other/shop' }, 'bright'), /own user.pet/i);
  assert.throws(() => cleanBusinessApplication({ ...input, publicProofUrl: '' }, 'bright'), /public proof URL/i);
  assert.throws(() => cleanBusinessApplication({ ...input, proofExplanation: 'Trust me' }, 'bright'), /30/);
  assert.throws(() => cleanBusinessApplication({ ...input, fulfillment: 'Soon' }, 'bright'), /20/);
});
