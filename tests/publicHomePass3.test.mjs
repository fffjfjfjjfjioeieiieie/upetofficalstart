import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(
  new URL("../src/features/home/HomePage.jsx", import.meta.url),
  "utf8",
);
const copy = readFileSync(
  new URL("../src/content/home-copy.ts", import.meta.url),
  "utf8",
);
const shared = readFileSync(
  new URL("../src/features/home/shared/HomeShared.jsx", import.meta.url),
  "utf8",
);
const renderer = readFileSync(
  new URL("../src/features/home/shared/RealProfile.jsx", import.meta.url),
  "utf8",
);
const fixture = readFileSync(
  new URL("../src/features/home/data/lamp-profile.js", import.meta.url),
  "utf8",
);
const playground = readFileSync(
  new URL("../src/features/home/playground/Playground.jsx", import.meta.url),
  "utf8",
);
const donations = readFileSync(
  new URL(
    "../src/features/home/donations/DonationsSection.jsx",
    import.meta.url,
  ),
  "utf8",
);

test("public homepage keeps its fourth-pass headline and invite-only handoff", () => {
  assert.match(copy, /Your link,/);
  assert.match(copy, /unmistakably you\./);
  assert.match(copy, /Invite-only while we get it right/);
  assert.match(copy, /login/);
  assert.doesNotMatch(home, /firebase|firestore|stripe/i);
});

test("homepage playground uses the real renderer and editor primitives", () => {
  assert.match(renderer, /ProfileScene/);
  assert.match(renderer, /sanitizeRedesignProfile/);
  assert.match(playground, /serializeDesign/);
  assert.match(playground, /type="color"/);
  assert.match(playground, /type="range"/);
});

test("Lamp playground snapshot and donation demo stay local", () => {
  assert.match(fixture, /lamp-saved\/avatar\.jpg/);
  assert.match(fixture, /lamp-saved\/banner\.jpg/);
  assert.match(fixture, /lamp-saved\/background\.jpg/);
  assert.match(fixture, /lamp-saved\/cover\.jpg/);
  assert.match(fixture, /snakelike \(the stars collide\)/);
  assert.match(fixture, /i own upet/);
  assert.match(donations, /donationDemoReducer/);
  assert.match(donations, /aria-live/);
  assert.doesNotMatch(
    `${playground}${donations}`,
    /fetch\(|onSnapshot|getDoc|setDoc|stripe/i,
  );
});
