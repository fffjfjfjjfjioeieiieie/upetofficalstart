import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedPreviewSource, previewWidth } from '../server/mediaPreview.js';

test('homepage media previews accept only managed HTTPS storage', () => {
  assert.equal(isAllowedPreviewSource('https://abc.public.blob.vercel-storage.com/profiles/user/banner.gif'), true);
  assert.equal(isAllowedPreviewSource('https://media.user.pet/profiles/user/banner.jpg', 'https://media.user.pet'), true);
  assert.equal(isAllowedPreviewSource('http://abc.public.blob.vercel-storage.com/banner.jpg'), false);
  assert.equal(isAllowedPreviewSource('https://127.0.0.1/private.png'), false);
  assert.equal(isAllowedPreviewSource('not-a-url'), false);
});

test('homepage media previews keep thumbnail sizes bounded', () => {
  assert.equal(previewWidth(80), 160);
  assert.equal(previewWidth(520), 520);
  assert.equal(previewWidth(5000), 900);
  assert.equal(previewWidth('invalid'), 640);
});
