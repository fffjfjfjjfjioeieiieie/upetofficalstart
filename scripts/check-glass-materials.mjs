import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { expect } from 'playwright/test';

const origin = 'http://127.0.0.1:5174';
const browser = await chromium.launch({ headless: true, ...(process.env.UPET_CHROMIUM_EXECUTABLE ? { executablePath: process.env.UPET_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'no-preference', ...(width === 390 ? { hasTouch: true, isMobile: true } : {}) });
    let revision = 0;
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname === '/api/v2-profile') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ draftRevision: ++revision, changed: true }) });
      return route.continue();
    });
    await context.addInitScript(() => {
      window.__glassGlCalls = 0;
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (/^webgl/.test(type)) window.__glassGlCalls += 1;
        return original.call(this, type, ...args);
      };
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const gpuRequests = [];
    page.on('request', (request) => { if (/\/three[./-]/.test(request.url())) gpuRequests.push(request.url()); });
    await page.goto(`${origin}/tests/studio-v2-harness.html`);
    await page.getByLabel('Preview quality', { exact: true }).selectOption('high');
    const card = page.locator('.upet-studio-v2__profile-card');
    for (const material of ['crystal', 'frosted', 'smoked-glass', 'tinted-glass']) {
      await page.getByLabel('Profile material', { exact: true }).selectOption(material);
      await page.getByLabel('Material edge width', { exact: true }).focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await expect(page.getByLabel('Material edge width', { exact: true })).toHaveValue('2');
      await expect(card).toHaveCSS('border-left-width', '2px');
      for (const background of ['dark', 'bright']) {
        await page.locator('.upet-studio-v2__canvas').evaluate((element, mode) => { element.style.background = mode === 'bright' ? 'repeating-linear-gradient(45deg,#fff 0 30px,#73bfe2 30px 60px)' : 'linear-gradient(135deg,#090d19,#092b39)'; }, background);
        await page.evaluate(() => scrollTo(0, 0));
        await card.screenshot({ path: `/tmp/upet-stage4-${material}-${background}-${width}.png` });
      }
      await page.getByLabel('Preview quality', { exact: true }).selectOption('lite');
      await expect(card).toHaveCSS('backdrop-filter', 'none');
      await card.screenshot({ path: `/tmp/upet-stage4-${material}-lite-${width}.png` });
      await page.getByLabel('Preview quality', { exact: true }).selectOption('high');
    }
    await page.getByLabel('Material backdrop blur', { exact: true }).focus();
    await page.keyboard.press('End');
    await expect(card).toHaveCSS('backdrop-filter', 'blur(40px) saturate(1.15)');
    await page.getByLabel('Material surface grain', { exact: true }).focus();
    await page.keyboard.press('Home');
    assert.equal(await card.evaluate((node) => getComputedStyle(node, '::after').opacity), '0');
    await page.evaluate(() => scrollTo(0, 0));
    const bounds = await card.boundingBox();
    if (width === 1440) {
      await page.mouse.move(bounds.x + bounds.width * .8, bounds.y + bounds.height * .7);
      await expect.poll(() => card.evaluate((node) => parseFloat(getComputedStyle(node).getPropertyValue('--upet-material-highlight-x')))).toBeGreaterThan(65);
      await page.getByLabel('Motion', { exact: true }).selectOption('reduce');
      await expect.poll(() => card.evaluate((node) => parseFloat(getComputedStyle(node).getPropertyValue('--upet-material-highlight-x')))).toBe(20);
      await page.mouse.move(bounds.x + bounds.width * .9, bounds.y + bounds.height * .8);
      await expect.poll(() => card.evaluate((node) => parseFloat(getComputedStyle(node).getPropertyValue('--upet-material-highlight-x')))).toBe(20);
    } else {
      await page.touchscreen.tap(bounds.x + bounds.width * .8, bounds.y + bounds.height * .7);
      await expect.poll(() => card.evaluate((node) => parseFloat(getComputedStyle(node).getPropertyValue('--upet-material-highlight-x')))).toBe(20);
    }
    assert.equal(await page.evaluate(() => window.__glassGlCalls), 0);
    assert.equal(gpuRequests.length, 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('DOM glass: four recipes, bright/dark/Lite, real blur/edge/grain controls, spring pointer, reduced motion, touch fallback, no GL allocation/download, no errors/overflow. Visual transport stub only.');
} finally { await browser.close(); }
