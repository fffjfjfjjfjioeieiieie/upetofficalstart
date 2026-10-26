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
    await context.addInitScript(() => {
      const original = WebGL2RenderingContext.prototype.uniform4fv;
      WebGL2RenderingContext.prototype.uniform4fv = function (location, data, ...rest) {
        if (data.length === 16 && [3, 7, 11, 15].every((index) => data[index] === 0 || data[index] === 1)) window.__waterRingUpload = Array.from(data);
        return original.call(this, location, data, ...rest);
      };
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' && /THREE|WebGL|shader/i.test(message.text())) errors.push(message.text()); });
    await page.goto(`${origin}/tests/studio-v2-harness.html`);
    await page.evaluate(() => document.fonts.ready);
    await page.getByLabel('Preview quality', { exact: true }).selectOption('high');
    await page.getByLabel('Profile material', { exact: true }).selectOption('water');
    const card = page.locator('.upet-studio-v2__profile-card');
    await expect(card).toHaveAttribute('data-gpu-state', 'ready');
    await page.waitForFunction(() => window.__waterRingUpload?.length === 16);
    assert.equal(await page.evaluate(() => window.__waterRingUpload[3]), 0);
    const bounds = await card.boundingBox();
    await card.dispatchEvent('pointerdown', { pointerType: width === 390 ? 'touch' : 'mouse', clientX: bounds.x + bounds.width * .75, clientY: bounds.y + bounds.height * .8 });
    await page.waitForFunction(() => window.__waterRingUpload[3] === 1 && window.__waterRingUpload[2] > 0);
    for (let index = 0; index < 7; index++) await card.dispatchEvent('pointerdown', { pointerType: 'mouse', clientX: bounds.x + bounds.width * .25, clientY: bounds.y + bounds.height * .7 });
    assert.equal(await page.evaluate(() => window.__waterRingUpload.length), 16, 'GPU ring array stays bounded');
    const moving = await card.screenshot();
    await page.waitForTimeout(300);
    assert.equal(moving.equals(await card.screenshot({ path: `/tmp/upet-stage4-water-active-${width}.png` })), false);
    const damping = page.getByLabel('Material ripple damping', { exact: true });
    await damping.focus();
    await page.keyboard.press('End');
    await expect(damping).toHaveValue('5');
    await page.evaluate(() => scrollTo(0, 0));
    await page.getByLabel('Motion', { exact: true }).selectOption('reduce');
    await page.evaluate(() => scrollTo(0, 0));
    await settle(page);
    const reduced = await card.screenshot({ path: `/tmp/upet-stage4-water-reduced-${width}.png` });
    const frozenRings = await page.evaluate(() => window.__waterRingUpload);
    await page.waitForTimeout(250);
    assert.equal(reduced.equals(await card.screenshot()), true);
    await card.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: bounds.x + 20, clientY: bounds.y + 20 });
    await settle(page);
    assert.deepEqual(await page.evaluate(() => window.__waterRingUpload), frozenRings, 'reduced motion does not start touch ripples');
    await page.getByLabel('Preview quality', { exact: true }).selectOption('lite');
    await expect(card).toHaveAttribute('data-gpu-state', 'fallback');
    await card.screenshot({ path: `/tmp/upet-stage4-water-lite-${width}.png` });
    assert.equal(await card.getByRole('heading', { name: 'Preview User', exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('Water: actual coherent GPU motion and mouse/touch ring uniform uploads, bounded rings, damping control, reduced-motion freeze, Lite/native content and desktop/mobile pass without shader/page errors or overflow. Synthetic transport only.');
} finally { await browser.close(); }
