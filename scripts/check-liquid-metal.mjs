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
    await page.getByLabel('Preview quality', { exact: true }).selectOption('high');
    await page.getByLabel('Profile material', { exact: true }).selectOption('liquid-metal');
    const card = page.locator('.upet-studio-v2__profile-card');
    await expect(card).toHaveAttribute('data-gpu-state', 'ready');
    const moving = await card.screenshot();
    await page.waitForTimeout(500);
    const later = await card.screenshot({ path: `/tmp/upet-stage4-liquid-metal-active-${width}.png` });
    assert.equal(moving.equals(later), false, 'actual rendered reflections must move');

    const speed = page.getByLabel('Material flow speed', { exact: true });
    await speed.focus();
    await page.keyboard.press('Home');
    await expect(speed).toHaveValue('0');
    await page.evaluate(() => scrollTo(0, 0));
    await expect(card).toHaveAttribute('data-gpu-state', 'ready');
    await settle(page);
    const stopped = await card.screenshot();
    await page.waitForTimeout(200);
    assert.equal(stopped.equals(await card.screenshot()), true, 'zero speed freezes the surface');

    await speed.focus();
    await page.keyboard.press('End');
    await page.evaluate(() => scrollTo(0, 0));
    await expect(card).toHaveAttribute('data-gpu-state', 'ready');
    const resumed = await card.screenshot();
    await page.waitForTimeout(300);
    assert.equal(resumed.equals(await card.screenshot()), false, 'resuming flow restarts the same scene');

    await page.getByLabel('Motion', { exact: true }).selectOption('reduce');
    await page.evaluate(() => scrollTo(0, 0));
    await expect(card).toHaveAttribute('data-reduced-motion', 'true');
    await expect(card).toHaveAttribute('data-gpu-state', 'ready');
    await settle(page);
    const reduced = await card.screenshot({ path: `/tmp/upet-stage4-liquid-metal-reduced-${width}.png` });
    await page.waitForTimeout(200);
    assert.equal(reduced.equals(await card.screenshot()), true, 'reduced motion keeps native content and a frozen scene');

    await page.getByLabel('Preview quality', { exact: true }).selectOption('lite');
    await expect(card).toHaveAttribute('data-gpu-state', 'fallback');
    assert.equal(await card.getByRole('heading', { name: 'Preview User', exact: true }).count(), 1);
    await card.screenshot({ path: `/tmp/upet-stage4-liquid-metal-lite-${width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('Liquid metal: actual changing GPU reflections, zero-speed freeze/resume, reduced-motion freeze, Lite/native content, desktop/mobile, no shader/page errors or overflow. Visual transport stub only.');
} finally { await browser.close(); }
