import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDraftSaveCoordinator,
  hasFounderPreviewClaim,
  studioPreviewEnabled,
} from '../src/features/studio/v2/studioPreviewPolicy.js';

test('Studio preview is local or explicitly flagged and never grants access from email', () => {
  assert.equal(studioPreviewEnabled('127.0.0.1', undefined), true);
  assert.equal(studioPreviewEnabled('user.pet', undefined), false);
  assert.equal(studioPreviewEnabled('user.pet', 'true'), true);
  assert.equal(hasFounderPreviewClaim({ email: 'founder@example.com' }), false);
  assert.equal(hasFounderPreviewClaim({ roles: ['founder'] }), true);
});

test('draft coordinator serializes overlapping edits and sends the newest profile last', async () => {
  const saved = [];
  let concurrent = 0;
  let maximumConcurrent = 0;
  let releaseFirst;
  const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
  const coordinator = createDraftSaveCoordinator({
    delayMs: 1000,
    save: async (value) => {
      concurrent += 1;
      maximumConcurrent = Math.max(maximumConcurrent, concurrent);
      if (value === 'first') await firstGate;
      saved.push(value);
      concurrent -= 1;
      return { draftRevision: saved.length };
    },
  });
  coordinator.enqueue('first');
  const flushing = coordinator.flush();
  await Promise.resolve();
  await Promise.resolve();
  coordinator.enqueue('intermediate');
  coordinator.enqueue('latest');
  releaseFirst();
  await flushing;
  assert.deepEqual(saved, ['first', 'latest']);
  assert.equal(maximumConcurrent, 1);
  assert.equal(coordinator.hasPending(), false);
  coordinator.dispose();
});

test('draft coordinator retains a failed edit for explicit retry', async () => {
  let tries = 0;
  const coordinator = createDraftSaveCoordinator({
    delayMs: 1000,
    save: async () => {
      tries += 1;
      if (tries === 1) throw new Error('offline');
      return { draftRevision: 1 };
    },
  });
  coordinator.enqueue({ title: 'Keep me' });
  await assert.rejects(coordinator.flush(), /offline/);
  assert.equal(coordinator.hasPending(), true);
  await coordinator.flush();
  assert.equal(tries, 2);
  assert.equal(coordinator.hasPending(), false);
  coordinator.dispose();
});
