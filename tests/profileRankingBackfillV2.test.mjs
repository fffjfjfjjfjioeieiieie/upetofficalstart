import assert from 'node:assert/strict';
import test from 'node:test';
import { applyRankingBackfillPage, loadRankingBackfillPage } from '../server/v2/profileRankingBackfill.js';

test('ranking backfill pages legacy view counts and never overwrites live aggregate documents', async () => {
  const aggregate = new Map([['alpha', { views: 99 }]]);
  const db = {
    collection(name) {
      if (name === 'directoryProfiles') return { orderBy: () => ({
        startAfter: () => { throw new Error('Cursor was not expected on first page.'); },
        limit: (size) => ({ get: async () => {
          assert.equal(size, 3);
          return { docs: ['alpha', 'bravo', 'charlie'].map((id) => ({ id })) };
        } }),
      }) };
      if (name === 'profileEvents') return { doc: (username) => ({ collection: () => ({ where: () => ({ count: () => ({ get: async () => ({ data: () => ({ count: username === 'alpha' ? 5 : 2 }) }) }) }) }) }) };
      if (name === 'profileRankingStats') return { doc: (id) => ({ id }) };
      throw new Error(`Unexpected collection ${name}`);
    },
    runTransaction: async (callback) => callback({
      get: async (reference) => ({ exists: aggregate.has(reference.id) }),
      create: (reference, data) => aggregate.set(reference.id, data),
    }),
  };
  const page = await loadRankingBackfillPage(db, { pageSize: 2 });
  assert.equal(page.hasMore, true);
  assert.deepEqual(page.rows, [{ username: 'alpha', views: 5 }, { username: 'bravo', views: 2 }]);
  assert.deepEqual(await applyRankingBackfillPage(db, page.rows), { created: 0, skipped: 2, dryRun: true });
  assert.deepEqual(await applyRankingBackfillPage(db, page.rows, { dryRun: false }), { created: 1, skipped: 1, dryRun: false });
  assert.equal(aggregate.get('alpha').views, 99);
  assert.equal(aggregate.get('bravo').views, 2);
});
