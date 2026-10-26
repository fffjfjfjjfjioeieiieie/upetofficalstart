import assert from 'node:assert/strict';
import test from 'node:test';
import { createRenderScheduler } from '../src/graphics/core/renderScheduler.js';
import { createGraphicsResourceCache, createGraphicsResourceScope } from '../src/graphics/core/resourceCache.js';
import { readGraphicsPreferences, writeGraphicsPreferences } from '../src/graphics/quality/qualityPreferences.js';
import { createGraphicsQualityManager } from '../src/graphics/quality/qualityManager.js';

test('scheduler shares one frame, pauses hidden work and cancels on disposal', () => {
  let nextId = 0;
  const callbacks = new Map();
  const rendered = [];
  const scheduler = createRenderScheduler({
    render: (time) => rendered.push(time),
    requestFrame: (callback) => { const id = ++nextId; callbacks.set(id, callback); return id; },
    cancelFrame: (id) => callbacks.delete(id),
  });
  const tick = (time) => { const [id, callback] = callbacks.entries().next().value; callbacks.delete(id); callback(time); };
  scheduler.invalidate(); scheduler.invalidate(); scheduler.invalidate();
  assert.equal(callbacks.size, 1);
  tick(16);
  assert.deepEqual(rendered, [16]);
  assert.equal(callbacks.size, 0, 'static work must stop');
  scheduler.setContinuous(true);
  tick(32);
  assert.equal(callbacks.size, 1);
  scheduler.setPaused(true);
  assert.equal(callbacks.size, 0);
  scheduler.invalidate();
  assert.equal(callbacks.size, 0);
  scheduler.setPaused(false);
  assert.equal(callbacks.size, 1);
  scheduler.dispose();
  assert.equal(callbacks.size, 0);
  scheduler.invalidate();
  assert.equal(callbacks.size, 0);
});

test('scenes share resources until the final lease and dispose private geometry/material/texture separately', () => {
  const disposed = [];
  const cache = createGraphicsResourceCache();
  const first = createGraphicsResourceScope(cache);
  const second = createGraphicsResourceScope(cache);
  const geometry = () => ({ dispose: () => disposed.push('shared geometry') });
  assert.equal(first.shared('geometry', geometry), second.shared('geometry', geometry));
  for (const type of ['material', 'texture', 'render target']) first.own({ dispose: () => disposed.push(type) });
  first.dispose(); first.dispose();
  assert.deepEqual(disposed, ['material', 'texture', 'render target']);
  assert.equal(cache.snapshot().references, 1);
  second.dispose();
  assert.equal(disposed.filter((item) => item === 'shared geometry').length, 1);
  assert.equal(cache.snapshot().entries, 0);
  cache.dispose(); cache.dispose();
  assert.throws(() => cache.acquire('later', geometry), /disposed/);
});

test('visitor preferences survive reload and denied/corrupt storage safely falls back', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  writeGraphicsPreferences(storage, { quality: 'ultra', motion: 'reduce' });
  assert.deepEqual(readGraphicsPreferences(storage), { quality: 'ultra', motion: 'reduce' });
  storage.setItem('upet.graphics.v1', '{broken');
  assert.deepEqual(readGraphicsPreferences(storage), { quality: 'auto', motion: 'system' });
  const blocked = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } };
  assert.doesNotThrow(() => writeGraphicsPreferences(blocked, { quality: 'lite' }));
  assert.deepEqual(readGraphicsPreferences(blocked), { quality: 'auto', motion: 'system' });
});

test('a broken resource disposer cannot strand other resources or shared leases', () => {
  const cache = createGraphicsResourceCache();
  const scope = createGraphicsResourceScope(cache);
  let released = 0;
  scope.own({ dispose() { throw Error('broken driver allocation'); } });
  scope.own({ dispose() { released += 1; } });
  scope.shared('shared', () => ({ dispose() { released += 1; } }));
  assert.doesNotThrow(() => scope.dispose());
  assert.equal(released, 2);
  assert.equal(cache.snapshot().entries, 0);
});

test('same-tier manual preference notifies controls and initial ceilings/reduced-motion sampling are enforced', () => {
  const manager = createGraphicsQualityManager({ initialTier: 'ultra', maximumTier: 'balanced', sampleSize: 2 });
  assert.equal(manager.state().tier, 'balanced');
  const values = [];
  const unsubscribe = manager.subscribe((value) => values.push(value.preference));
  manager.setPreference('balanced');
  assert.equal(values.at(-1), 'balanced');
  manager.setPreference('auto');
  manager.setReducedMotion(true);
  manager.recordFrame(100); manager.recordFrame(100);
  assert.equal(manager.state().tier, 'balanced');
  unsubscribe();
});
