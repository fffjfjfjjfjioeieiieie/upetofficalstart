import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('retired bot has no visitor data requests or interaction handlers', async () => {
  const index = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(index, /fetch\(|InteractionCreate|visitor-admin|VISITOR_BOT_SECRET/);
});
