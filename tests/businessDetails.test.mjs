import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanBusinessDetails } from '../src/shared/businessDetails.js';

test('business mode accepts core shop details without verification proof', () => {
  const result = cleanBusinessDetails({ businessName: 'Upet Goods', category: 'digital', description: 'A small shop for digital community products.', website: '' });
  assert.equal(result.businessName, 'Upet Goods');
  assert.equal(result.website, '');
  assert.throws(() => cleanBusinessDetails({ ...result, website: 'javascript:evil()' }), /valid http/i);
});
