import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanBusinessApplication } from '../src/shared/businessApplication.js';

test('business applications require useful details and a web URL', () => {
  const input = { businessName: '  Bright Goods  ', category: 'physical', website: 'https://example.com/shop', description: 'We make small-batch stationery and ship from London.' };
  assert.equal(cleanBusinessApplication(input).businessName, 'Bright Goods');
  assert.equal(cleanBusinessApplication(input).website, 'https://example.com/shop');
  assert.throws(() => cleanBusinessApplication({ ...input, website: 'javascript:alert(1)' }), /valid http or https/i);
  assert.throws(() => cleanBusinessApplication({ ...input, description: 'Short' }), /at least 20/i);
});
