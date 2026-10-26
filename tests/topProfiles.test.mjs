import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTopProfiles, rankTopProfiles } from '../server/topProfiles.js';

test('homepage rotation pool contains at most the top 100 valid profiles', () => {
  const rows = Array.from({ length: 120 }, (_, index) => ({ username: `user${String(index).padStart(3, '0')}`, views: index }));
  const ranked = rankTopProfiles(rows);
  assert.equal(ranked.length, 100);
  assert.equal(ranked[0].views, 119);
  assert.equal(ranked.at(-1).views, 20);
});

test('shared snapshot reads bounded ranking aggregates without per-profile count queries', async () => {
  const time = Date.now();
  let stored;
  let rankingReads = 0;
  let batchReads = 0;
  const snapshotRef = {
    get: async () => ({ data: () => stored }),
    set: async (value) => { stored = value; },
  };
  const db = {
    collection: (name) => {
      if (name === 'siteCache') return { doc: () => snapshotRef };
      if (name === 'profileRankingStats') return { orderBy: () => ({ limit: (size) => ({ get: async () => {
        assert.equal(size, 100);
        rankingReads += 1;
        return { docs: ['alpha', 'bravo'].map((id) => ({ id, data: () => ({ views: id === 'alpha' ? 10 : 5 }) })) };
      } }) }) };
      if (name === 'profiles' || name === 'directoryProfiles') return { doc: (id) => ({ id, collection: name }) };
      throw new Error(`Unexpected collection: ${name}`);
    },
    getAll: async (...refs) => {
      batchReads += 1;
      return refs.map((ref) => ({ data: () => ref.collection === 'profiles'
        ? { status: 'published', published: { redesign: { displayName: ref.id } } }
        : { displayName: ref.id } }));
    },
    runTransaction: async (callback) => callback({
      get: (ref) => ref.get(),
      set: (_ref, value) => { stored = { ...stored, ...value }; },
    }),
  };

  const first = await loadTopProfiles(db, time);
  const second = await loadTopProfiles(db, time + 60_000);
  assert.deepEqual(second, first);
  assert.equal(first[0].username, 'alpha');
  assert.equal(rankingReads, 1);
  assert.equal(batchReads, 1);

  stored.refreshedAtMs = time - 2 * 60 * 60_000;
  stored.leaseUntilMs = time + 120_000;
  const stale = await loadTopProfiles(db, time + 60_000);
  assert.deepEqual(stale, first);
  assert.equal(rankingReads, 1, 'a held refresh lease must not start another sweep');

  stored.leaseUntilMs = 0;
  const refreshed = await loadTopProfiles(db, time + 2 * 60 * 60_000);
  assert.deepEqual(refreshed, first);
  assert.equal(rankingReads, 2);
  assert.equal(batchReads, 2);
});
