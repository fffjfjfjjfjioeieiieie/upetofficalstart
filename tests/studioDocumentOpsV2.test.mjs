import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyProfileDocumentV2 } from '../src/shared/contracts/profileV2.js';
import {
  addStudioBlock,
  commitStudioHistory,
  createStudioHistory,
  patchStudioBlockLayout,
  redoStudioHistory,
  reorderStudioBlocks,
  undoStudioHistory,
} from '../src/features/studio/v2/studioDocumentOps.js';

const profile = () => createEmptyProfileDocumentV2({ ownerUid: 'owner', username: 'safe-user', nowMs: 1_000 });

test('block creation and reorder preserve page data and normalize stable order', () => {
  const first = addStudioBlock(profile(), 'home', 'heading', 'one');
  const second = addStudioBlock(first, 'home', 'text', 'two');
  const third = addStudioBlock(second, 'home', 'divider', 'three');
  const moved = reorderStudioBlocks(third, 'home', 'three', 'one');
  assert.deepEqual(moved.pages[0].blocks.map((block) => block.id), ['three', 'one', 'two']);
  assert.deepEqual(moved.pages[0].blocks.map((block) => block.order), [0, 1, 2]);
  assert.equal(moved.ownerUid, 'owner');
  assert.equal(moved.pages[0].blocks[0].accessibility.decorative, true);
  assert.equal(reorderStudioBlocks(moved, 'home', 'missing', 'one'), moved);
  assert.throws(() => addStudioBlock(profile(), 'home', 'unsafe-widget', 'bad'), /Unsupported/);
});

test('desktop and mobile layout edits stay independent and bounded', () => {
  const original = addStudioBlock(profile(), 'home', 'text', 'block');
  const mobile = patchStudioBlockLayout(original, 'home', 'block', 'mobile', 'x', 85);
  const fitted = patchStudioBlockLayout(mobile, 'home', 'block', 'mobile', 'width', 80);
  assert.equal(fitted.pages[0].blocks[0].layout.mobile.x, 85);
  assert.equal(fitted.pages[0].blocks[0].layout.mobile.width, 15);
  assert.equal(fitted.pages[0].blocks[0].layout.desktop.x, 5);
  assert.equal(fitted.pages[0].blocks[0].layout.desktop.width, 90);
  assert.throws(() => patchStudioBlockLayout(fitted, 'home', 'block', 'mobile', 'y', Infinity), /finite/);
});

test('history coalesces one field edit, bounds undo depth and clears redo after new work', () => {
  let history = createStudioHistory({ value: 0 }, 2);
  history = commitStudioHistory(history, { value: 1 }, { group: 'title', atMs: 100 });
  history = commitStudioHistory(history, { value: 2 }, { group: 'title', atMs: 200 });
  assert.equal(history.past.length, 1);
  assert.equal(undoStudioHistory(history).present.value, 0);
  history = commitStudioHistory(history, { value: 3 }, { group: 'bio', atMs: 1100 });
  history = commitStudioHistory(history, { value: 4 }, { group: 'other', atMs: 2000 });
  assert.equal(history.past.length, 2);
  history = undoStudioHistory(history);
  assert.equal(history.present.value, 3);
  history = redoStudioHistory(history);
  assert.equal(history.present.value, 4);
  history = undoStudioHistory(history);
  history = commitStudioHistory(history, { value: 5 }, { group: 'new', atMs: 3000 });
  assert.equal(history.future.length, 0);
  assert.equal(redoStudioHistory(history), history);
});
