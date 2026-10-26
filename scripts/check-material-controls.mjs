import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { expect } from 'playwright/test';

const origin = 'http://127.0.0.1:5174';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], ...(process.env.UPET_CHROMIUM_EXECUTABLE ? { executablePath: process.env.UPET_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    let fixtureRevision = 0;
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      // Visual-only transport stub; this is not a Firebase save/reload test.
      if (url.pathname === '/api/v2-profile') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ draftRevision: ++fixtureRevision, changed: true }) });
      if (url.pathname.startsWith('/api/')) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' && /THREE|WebGL|shader/i.test(message.text())) errors.push(message.text()); });
    await page.goto(`${origin}/tests/studio-v2-harness.html`);
    await page.getByLabel('Preview quality', { exact: true }).selectOption('high');
    await page.getByLabel('Profile material', { exact: true }).selectOption('chrome');
    const profileCard = page.locator('.upet-studio-v2__profile-card');
    await expect(profileCard).toHaveAttribute('data-gpu-state', 'ready');
    await page.getByLabel('Material roughness', { exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByLabel('Material roughness', { exact: true })).toHaveValue('0.25');
    await page.evaluate(() => scrollTo(0, 0));
    await expect(profileCard).toHaveAttribute('data-gpu-state', 'ready');
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await profileCard.screenshot({ path: `/tmp/upet-stage4-chrome-card-${width}.png` });
    await page.screenshot({ path: `/tmp/upet-stage4-chrome-${width}.png`, fullPage: true });
    for (const metal of ['brushed-steel', 'gold', 'rose-gold', 'dark-metal']) {
      await page.getByLabel('Profile material', { exact: true }).selectOption(metal);
      await page.evaluate(() => scrollTo(0, 0));
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(profileCard).toHaveAttribute('data-gpu-state', 'ready');
      if (metal === 'brushed-steel') {
        await page.getByLabel('Material brush direction', { exact: true }).focus();
        await page.keyboard.press('ArrowRight');
        await expect(page.getByLabel('Material brush direction', { exact: true })).toHaveValue('5');
        await page.evaluate(() => scrollTo(0, 0));
        await expect(profileCard).toHaveAttribute('data-gpu-state', 'ready');
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      }
      for (const background of ['dark', 'bright']) {
        await page.locator('.upet-studio-v2__canvas').evaluate((element, mode) => { element.style.background = mode === 'bright' ? 'linear-gradient(135deg, #fff, #bddef0)' : 'linear-gradient(135deg, #090d19, #092b39)'; }, background);
        await profileCard.screenshot({ path: `/tmp/upet-stage4-${metal}-${background}-${width}.png` });
      }
      await page.getByLabel('Preview quality', { exact: true }).selectOption('lite');
      await expect(profileCard).toHaveAttribute('data-gpu-state', 'fallback');
      await profileCard.screenshot({ path: `/tmp/upet-stage4-${metal}-lite-${width}.png` });
      await page.getByLabel('Preview quality', { exact: true }).selectOption('high');
      await expect(profileCard).toHaveAttribute('data-gpu-state', 'ready');
    }
    await page.getByLabel('Profile material', { exact: true }).selectOption('chrome');
    await page.getByLabel('Preview quality', { exact: true }).selectOption('lite');
    await expect(profileCard).toHaveAttribute('data-gpu-state', 'fallback');
    await expect(profileCard).toHaveAttribute('data-quality', 'lite');
    await page.screenshot({ path: `/tmp/upet-stage4-chrome-lite-${width}.png`, fullPage: true });
    await page.getByLabel('Profile material', { exact: true }).selectOption('frosted');
    const blur = page.getByLabel('Material backdrop blur', { exact: true });
    await blur.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(blur).toHaveValue('27');
    await page.getByRole('button', { name: '+ heading', exact: true }).click();
    await page.getByLabel('Use profile material', { exact: true }).uncheck();
    await page.getByLabel('Layer material', { exact: true }).selectOption('holographic');
    await expect(page.locator('.upet-profile-block-surface')).toHaveAttribute('data-material', 'holographic');
    await page.getByLabel('Use profile material', { exact: true }).check();
    await expect(page.locator('.upet-profile-block-surface')).toHaveCount(0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('Material slice: five GPU/Lite metals on bright/dark surroundings, brush and roughness keyboard editing, glass blur, layer override/reset, desktop/mobile and no runtime/shader errors passed. Transport is a local visual stub only.');
} finally { await browser.close(); }
