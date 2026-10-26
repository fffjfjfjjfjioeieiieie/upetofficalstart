import test from 'node:test';
import assert from 'node:assert/strict';

process.env.R2_ACCOUNT_ID = 'test-account';
process.env.R2_ACCESS_KEY_ID = 'test-access-key';
process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.R2_BUCKET = 'test-bucket';
process.env.R2_PUBLIC_BASE_URL = 'https://media.example.test';

const { createR2Upload, deleteR2Media, r2MediaConfigured } = await import('../server/r2Media.js');

test('R2 media upload URLs are short-lived and scoped to the Firebase owner path', async () => {
  assert.equal(r2MediaConfigured(), true);
  const result = await createR2Upload({
    uid: 'firebase-user-1', kind: 'audio', fileName: 'song.mp3', contentType: 'audio/mpeg', size: 2048,
  });
  const uploadUrl = new URL(result.uploadUrl);
  assert.equal(result.provider, 'r2');
  assert.match(result.key, /^profiles\/firebase-user-1\/audio-[a-f0-9-]+\.mp3$/);
  assert.equal(result.url, `https://media.example.test/${result.key}`);
  assert.equal(uploadUrl.hostname, 'test-bucket.test-account.r2.cloudflarestorage.com');
  assert.ok(uploadUrl.searchParams.has('X-Amz-Signature'));
  assert.match(uploadUrl.searchParams.get('X-Amz-Expires'), /^300$/);
});

test('R2 deletion rejects URLs outside the owner media namespace', async () => {
  assert.equal(await deleteR2Media('https://media.example.test/profiles/another-user/avatar-a.png', 'firebase-user-1'), false);
  assert.equal(await deleteR2Media('https://other.example.test/profiles/firebase-user-1/avatar-a.png', 'firebase-user-1'), false);
});
