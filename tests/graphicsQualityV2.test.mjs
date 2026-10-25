import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GRAPHICS_BUDGETS,
  boundedGraphicsDpr,
  createGraphicsQualityManager,
  initialGraphicsTier,
} from '../src/graphics/quality/qualityManager.js';

test('initial tier and DPR remain bounded by capability and data-saver signals', () => {
  assert.equal(initialGraphicsTier({ saveData: true, deviceMemory: 16 }), 'lite');
  assert.equal(initialGraphicsTier({ webglAvailable: false }), 'lite');
  assert.equal(initialGraphicsTier({ deviceMemory: 1 }), 'lite');
  assert.equal(initialGraphicsTier({ deviceMemory: 8, hardwareConcurrency: 8 }), 'high');
  assert.equal(boundedGraphicsDpr('ultra', 4), 2);
  assert.equal(boundedGraphicsDpr('lite', 4), 1);
  assert.equal(GRAPHICS_BUDGETS.lite.shaderPasses, 0);
});

test('auto quality uses a p75 window, downgrade cooldown and two fast windows to upgrade', () => {
  let time = 1_000;
  const manager = createGraphicsQualityManager({ initialTier: 'high', now: () => time, cooldownMs: 500, sampleSize: 4, maximumTier: 'high' });
  for (let index = 0; index < 4; index++) manager.recordFrame(35);
  assert.equal(manager.state().tier, 'balanced');
  for (let index = 0; index < 4; index++) manager.recordFrame(35);
  assert.equal(manager.state().tier, 'balanced');
  time += 600;
  for (let index = 0; index < 4; index++) manager.recordFrame(35);
  assert.equal(manager.state().tier, 'lite');
  time += 600;
  for (let index = 0; index < 4; index++) manager.recordFrame(10);
  assert.equal(manager.state().tier, 'lite');
  for (let index = 0; index < 4; index++) manager.recordFrame(10);
  assert.equal(manager.state().tier, 'balanced');
});

test('hidden, reduced-motion and context-loss states stop animation without leaking subscribers', () => {
  const manager = createGraphicsQualityManager({ initialTier: 'high', sampleSize: 2 });
  const snapshots = [];
  const unsubscribe = manager.subscribe((value) => snapshots.push(value));
  manager.setReducedMotion(true);
  assert.equal(manager.state().motionEnabled, false);
  manager.setReducedMotion(false);
  manager.setVisible(false);
  assert.equal(manager.state().motionEnabled, false);
  manager.contextLost();
  assert.equal(manager.state().tier, 'lite');
  manager.contextRestored();
  assert.equal(manager.state().tier, 'balanced');
  unsubscribe();
  const count = snapshots.length;
  manager.setVisible(true);
  assert.equal(snapshots.length, count);
});
