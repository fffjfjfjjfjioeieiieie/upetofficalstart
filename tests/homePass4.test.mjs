import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  DEFAULT_DESIGN,
  deserializeDesign,
  sanitizeDesign,
  serializeDesign,
} from '../src/features/home/playground/state.js';
import {
  INITIAL_DONATION_DEMO,
  donationDemoReducer,
  validateDemoAmount,
} from '../src/features/home/donations/demo-state.js';
import {
  qualifiesForWall,
  stripPrivateProfileFields,
} from '../src/features/home/data/lamp-profile.js';
import { FrameScheduler } from '../src/lib/motion/scheduler.js';

test('playground design hashes round-trip without losing state', () => {
  const design = sanitizeDesign({
    background: 'underwater',
    accent: '#AABBCC',
    font: 'serif',
    card: 'cream',
    lens: 77,
    avatar: 'square',
    links: 'soft',
    music: false,
    preset: 'paper',
  });
  assert.deepEqual(deserializeDesign(`#${serializeDesign(design)}`), design);
});

test('invalid playground hash values fall back to bounded defaults', () => {
  const value = deserializeDesign(
    '#design=bg=unknown&a=oops&f=nope&c=nope&l=800&av=nope&ln=nope&m=0',
  );
  assert.equal(value.background, DEFAULT_DESIGN.background);
  assert.equal(value.accent, DEFAULT_DESIGN.accent);
  assert.equal(value.lens, 100);
  assert.equal(value.music, false);
});

test('donation amount validation accepts the demo bounds only', () => {
  assert.deepEqual(validateDemoAmount(1), { ok: true, amount: 1 });
  assert.deepEqual(validateDemoAmount('12.345'), { ok: true, amount: 12.35 });
  assert.equal(validateDemoAmount(0).ok, false);
  assert.equal(validateDemoAmount(501).ok, false);
  assert.equal(validateDemoAmount('words').ok, false);
});

test('donation demo reducer reports errors, adds a supporter, and resets', () => {
  const invalid = donationDemoReducer(INITIAL_DONATION_DEMO, {
    type: 'custom',
    value: '0',
  });
  assert.equal(
    donationDemoReducer(invalid, { type: 'submit', id: 'bad' }).status,
    'error',
  );
  const entered = donationDemoReducer(INITIAL_DONATION_DEMO, {
    type: 'message',
    value: 'Keep making things',
  });
  const complete = donationDemoReducer(entered, {
    type: 'submit',
    id: 'demo-1',
  });
  assert.equal(complete.status, 'success');
  assert.equal(complete.total, 194);
  assert.equal(complete.count, 13);
  assert.equal(complete.supporters[0].message, 'Keep making things');
  assert.deepEqual(
    donationDemoReducer(complete, { type: 'reset' }),
    INITIAL_DONATION_DEMO,
  );
});

test('profile wall qualification requires consent, public state, avatar and links', () => {
  const good = {
    username: 'lamp',
    public: true,
    media: { avatar: { src: '/avatar.jpg' } },
    links: [{}, {}],
  };
  assert.equal(qualifiesForWall(good), true);
  assert.equal(qualifiesForWall({ ...good, flagged: true }), false);
  assert.equal(qualifiesForWall({ ...good, username: 'not-allowed' }), false);
  assert.equal(qualifiesForWall({ ...good, links: [{}] }), false);
});

test('profile snapshot strips private fields recursively', () => {
  const clean = stripPrivateProfileFields({
    username: 'lamp',
    uid: 'private',
    nested: { email: 'private@example.test', label: 'public' },
    links: [{ label: 'public', inviteCode: 'private' }],
  });
  assert.deepEqual(clean, {
    username: 'lamp',
    nested: { label: 'public' },
    links: [{ label: 'public' }],
  });
});

test('frame scheduler shares one frame and stops when unsubscribed', () => {
  const queued = [];
  const cancelled = [];
  const scheduler = new FrameScheduler(
    (callback) => (queued.push(callback), queued.length),
    (id) => cancelled.push(id),
  );
  let calls = 0;
  const first = scheduler.subscribe(() => calls++);
  const second = scheduler.subscribe(() => calls++);
  assert.equal(queued.length, 1);
  queued.shift()(16);
  assert.equal(calls, 2);
  first();
  second();
  assert.ok(cancelled.length >= 1);
});

test('homepage copy contains no banned marketing language', async () => {
  const copy = await readFile(
    new URL('../src/content/home-copy.ts', import.meta.url),
    'utf8',
  );
  const banned =
    /\b(?:elevate|seamless|unlock|empower|crafted?|journey|supercharge|revolutionise|next-level|game-changing|effortless|cutting-edge|all-in-one|composed)\b|in a world where/i;
  assert.equal(banned.test(copy), false);
});
