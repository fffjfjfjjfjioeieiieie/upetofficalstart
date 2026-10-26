import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { expect } from 'playwright/test';

const origin = 'http://127.0.0.1:5174';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], ...(process.env.UPET_CHROMIUM_EXECUTABLE ? { executablePath: process.env.UPET_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
const settle = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'no-preference' });
    let revision = 0;
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname === '/api/v2-profile') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ draftRevision: ++revision, changed: true }) });
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' && /THREE|WebGL|shader/i.test(message.text())) errors.push(message.text()); });
    await page.goto(`${origin}/tests/studio-v2-harness.html`);
    await page.evaluate(() => document.fonts.ready);
    await page.getByLabel('Preview quality', { exact: true }).selectOption('high');
    await page.getByLabel('Profile material', { exact: true }).selectOption('holographic');
    const card = page.locator('.upet-studio-v2__profile-card');
    await expect(card).toHaveAttribute('data-gpu-state', 'ready');
    const setRange = async (label, key) => {
      const range = page.getByLabel(`Material ${label}`, { exact: true });
      await range.focus();
      await page.keyboard.press(key);
      await page.evaluate(() => scrollTo(0, 0));
      await settle(page);
    };
    await setRange('shimmer speed', 'Home');
    await page.mouse.move(0, 0);
    await settle(page);
    // Existing theme CSS crossfades background-color for .4s when GPU becomes ready.
    await page.waitForTimeout(500);
    const film = await card.screenshot({ path: `/tmp/upet-holographic-stopped-before-${width}.png` });
    await page.waitForTimeout(200);
    assert.equal(film.equals(await card.screenshot({ path: `/tmp/upet-holographic-stopped-after-${width}.png` })), true, `zero shimmer must stop redraw animation at ${width}`);
    await setRange('film thickness', 'End');
    const thick = await card.screenshot();
    assert.equal(film.equals(thick), false, 'thin-film thickness must affect actual GPU pixels');
    await setRange('iridescence intensity', 'Home');
    const noFilm = await card.screenshot();
    assert.equal(thick.equals(noFilm), false, 'thin-film intensity must affect actual GPU pixels');
    await setRange('iridescence intensity', 'End');
    await setRange('film thickness', 'Home');
    const bounds = await card.boundingBox();
    await page.mouse.move(bounds.x + bounds.width * .9, bounds.y + bounds.height * .4);
    await settle(page);
    const tilted = await card.screenshot();
    await page.mouse.move(0, 0);
    await settle(page);
    assert.equal(tilted.equals(await card.screenshot()), false, 'pointer tilt must affect physical lighting');
    await setRange('shimmer speed', 'End');
    const start = await card.screenshot();
    await page.waitForTimeout(400);
    assert.equal(start.equals(await card.screenshot()), false, 'shimmer must change reflected environment');
    await page.getByLabel('Motion', { exact: true }).selectOption('reduce');
    await page.evaluate(() => scrollTo(0, 0));
    await settle(page);
    const reduced = await card.screenshot();
    await page.waitForTimeout(200);
    assert.equal(reduced.equals(await card.screenshot()), true, 'reduced motion freezes the physical scene');
    // Capture useful defaults, not the intentionally extreme validation settings.
    await page.getByLabel('Profile material', { exact: true }).selectOption('matte');
    await page.getByLabel('Profile material', { exact: true }).selectOption('holographic');
    await expect(card).toHaveAttribute('data-gpu-state', 'ready');
    await page.waitForTimeout(500);
    for (const background of ['dark', 'bright']) {
      await page.locator('.upet-studio-v2__canvas').evaluate((element, bright) => { element.style.background = bright ? '#f4f6fa' : '#050b16'; }, background === 'bright');
      await card.screenshot({ path: `/tmp/upet-stage4-holographic-${background}-${width}.png` });
    }
    await page.getByLabel('Preview quality', { exact: true }).selectOption('lite');
    await expect(card).toHaveAttribute('data-gpu-state', 'fallback');
    assert.equal(await card.getByRole('heading', { name: 'Preview User', exact: true }).count(), 1);
    await card.screenshot({ path: `/tmp/upet-stage4-holographic-lite-${width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('Holographic: real GPU thin-film controls, pointer tilt, shimmer/stop, reduced-motion freeze, bright/dark/Lite, desktop/mobile, no shader/page errors or overflow. Synthetic transport only.');
} finally { await browser.close(); }
