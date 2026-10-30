import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/redesign/pages/public-home/PublicHome.jsx', import.meta.url), 'utf8');
const scene = readFileSync(new URL('../src/redesign/pages/public-home/GlassScene.jsx', import.meta.url), 'utf8');

test('public homepage keeps its required headline and invite-only handoff', () => {
  assert.match(home, /One link for everything you are\./);
  assert.match(home, /\/login\?create=1/);
  assert.doesNotMatch(home, /firebase|firestore|stripe/i);
});

test('homepage 3D is isolated, lazy and reuses shared Studio shader chunks', () => {
  assert.match(home, /lazy\(\(\) => import\('\.\/GlassScene\.jsx'\)\)/);
  assert.match(scene, /glslChunks/);
  assert.match(scene, /devicePixelRatio/);
  assert.match(scene, /visibilitychange/);
  assert.match(scene, /IntersectionObserver/);
  assert.match(scene, /prefers-reduced-motion/);
});

test('public editor controls are local state with accessible pressed states', () => {
  assert.match(home, /function InteractiveEditor/);
  assert.match(home, /aria-pressed/);
  assert.doesNotMatch(home, /fetch\(|onSnapshot|getDoc|setDoc/);
});
