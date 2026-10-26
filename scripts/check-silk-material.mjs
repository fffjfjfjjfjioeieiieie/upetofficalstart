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
      if (url.pathname.startsWith('/api/')) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' && /THREE|WebGL|shader/i.test(message.text())) errors.push(message.text()); });
    await page.goto(`${origin}/tests/studio-v2-harness.html`);
    await page.evaluate(() => document.fonts.ready);
    await page.getByLabel('Preview quality', { exact: true }).selectOption('high');
    await page.getByLabel('Profile material', { exact: true }).selectOption('silk');
    const card = page.locator('.upet-studio-v2__profile-card');
    await expect(card).toHaveAttribute('data-gpu-state', 'ready');
    await page.waitForTimeout(500);
    const start = await card.screenshot();
    await page.waitForTimeout(300);
    assert.equal(start.equals(await card.screenshot()), false, 'physical cloth folds must move');
    const setRange = async (label, key) => {
      await page.getByLabel(`Material ${label}`, { exact: true }).focus();
      await page.keyboard.press(key);
      await page.evaluate(() => scrollTo(0, 0));
      await settle(page);
    };
    await setRange('flow speed', 'Home');
    const stopped = await card.screenshot();
    await page.waitForTimeout(200);
    assert.equal(stopped.equals(await card.screenshot()), true, 'zero flow freezes current folds');
    await setRange('fabric sheen', 'Home');
    const matte = await card.screenshot();
    await setRange('fabric sheen', 'End');
    assert.equal(matte.equals(await card.screenshot()), false, 'actual physical sheen changes GPU pixels');
    await setRange('fold depth', 'Home');
    const flat = await card.screenshot();
    await setRange('fold depth', 'End');
    assert.equal(flat.equals(await card.screenshot()), false, 'fold depth changes physical shading');
    await setRange('fibre directionality', 'Home');
    const isotropic = await card.screenshot();
    await setRange('fibre directionality', 'End');
    assert.equal(isotropic.equals(await card.screenshot()), false, 'directional highlights change GPU pixels');
    await page.getByLabel('Profile material', { exact: true }).selectOption('matte');
    await page.getByLabel('Profile material', { exact: true }).selectOption('silk');
    await expect(card).toHaveAttribute('data-gpu-state', 'ready');
    await page.waitForTimeout(500);
    for (const background of ['dark', 'bright']) {
      await page.locator('.upet-studio-v2__canvas').evaluate((element, bright) => { element.style.background = bright ? '#f4f6fa' : '#050b16'; }, background === 'bright');
      await card.screenshot({ path: `/tmp/upet-stage4-silk-${background}-${width}.png` });
    }
    await page.getByLabel('Motion', { exact: true }).selectOption('reduce');
    await page.evaluate(() => scrollTo(0, 0));
    await settle(page);
    const reduced = await card.screenshot();
    await page.waitForTimeout(200);
    assert.equal(reduced.equals(await card.screenshot()), true);
    await page.getByLabel('Preview quality', { exact: true }).selectOption('lite');
    await expect(card).toHaveAttribute('data-gpu-state', 'fallback');
    await card.screenshot({ path: `/tmp/upet-stage4-silk-lite-${width}.png` });
    assert.equal(await card.getByRole('heading', { name: 'Preview User', exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('Silk: real moving mesh folds and physical sheen/anisotropy controls, stopped flow/reduced motion, bright/dark/Lite and native content at desktop/mobile; no shader/page errors or overflow. Synthetic transport only.');
} finally { await browser.close(); }
