import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDecorations } from "../src/shared/decorations.js";
import { readFileSync } from 'node:fs';

test('verified APNG metadata takes precedence over a static-looking PNG extension', () => {
  const [animated, staticWebp, staticOverride] = normalizeDecorations([
    { id:'apng', url:'https://example.com/flag.png', animated:true },
    { id:'webp', url:'https://example.com/still.webp', animated:false },
    { id:'static', url:'https://example.com/frame.gif', animated:false },
  ]);
  assert.equal(animated.animated, true);
  assert.equal(staticWebp.animated, false);
  assert.equal(staticOverride.animated, false);
});

test('the shipped external PNG decorations retain their verified animation metadata', () => {
  const catalogue=JSON.parse(readFileSync(new URL('../public/decorations.json',import.meta.url),'utf8'));
  const external=catalogue.filter((item)=>!item.url.includes('avatar-decoration-presets/'));
  assert.equal(external.length,22);
  assert.ok(external.every((item)=>item.animated===true));
  assert.ok(normalizeDecorations(external).every((item)=>item.animated===true));
});

test("keeps external static decoration URLs intact", () => {
  const url = "https://i.ibb.co/example/flag.png";
  const [decoration] = normalizeDecorations([{ id: "Flag", name: "Flag", category: "flags", url }]);

  assert.equal(decoration.label, "Flag");
  assert.equal(decoration.url, url);
  assert.equal(decoration.still, url);
  assert.equal(decoration.animated, false);
});

test("normalizes Discord decoration CDN variants", () => {
  const [decoration] = normalizeDecorations([{
    id: "123",
    label: "Animated decoration",
    url: "https://cdn.discordapp.com/avatar-decoration-presets/a_example.png?size=96&passthrough=true",
  }]);

  assert.equal(decoration.hash, "a_example");
  assert.equal(decoration.animated, true);
  assert.equal(decoration.url, "https://cdn.discordapp.com/avatar-decoration-presets/a_example.png?size=240&passthrough=true");
  assert.equal(decoration.still, "https://cdn.discordapp.com/avatar-decoration-presets/a_example.png?size=240&passthrough=false");
});
