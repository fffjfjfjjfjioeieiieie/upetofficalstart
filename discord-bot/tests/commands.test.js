import test from 'node:test';
import assert from 'node:assert/strict';
import { commands } from '../src/commands.js';

test('visitor and analytics commands contain every requested subcommand', () => {
  assert.deepEqual(commands.map((c) => c.name), ['visitor', 'analytics']);
  assert.deepEqual(commands[0].options.map((o) => o.name), ['info', 'network', 'history', 'claim', 'recent', 'myip']);
  assert.deepEqual(commands[1].options.map((o) => o.name), ['live', 'today', 'countries', 'security']);
  assert.ok(commands.every((c) => c.default_member_permissions));
});
