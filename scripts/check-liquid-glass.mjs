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
      const tracked = { textures: new Set(), framebuffers: new Set() };
      window.__lensAllocations = () => ({ textures: tracked.textures.size, framebuffers: tracked.framebuffers.size });
      const prototype = WebGL2RenderingContext.prototype;
      for (const [type, label] of [['Texture', 'textures'], ['Framebuffer', 'framebuffers']]) {
        const create = prototype[`create${type}`];
        const remove = prototype[`delete${type}`];
        prototype[`create${type}`] = function (...args) { const resource = create.apply(this, args); if (resource) tracked[label].add(resource); return resource; };
        prototype[`delete${type}`] = function (resource) { tracked[label].delete(resource); return remove.call(this, resource); };
      }
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' && /THREE|WebGL|shader/i.test(message.text())) errors.push(message.text()); });
    await page.goto(`${origin}/tests/studio-v2-harness.html`);
    await page.evaluate(() => document.fonts.ready);
    await page.getByLabel('Preview quality', { exact: true }).selectOption('balanced');
    await page.getByLabel('Profile material', { exact: true }).selectOption('liquid-glass');
    await page.getByLabel('Motion', { exact: true }).selectOption('reduce');
    await page.evaluate(() => scrollTo(0, 0));
    const card = page.locator('.upet-studio-v2__profile-card');
    await expect(card).toHaveAttribute('data-gpu-state', 'ready');
    await page.waitForTimeout(500);
    const setRange = async (label, key) => {
      await page.getByLabel(`Material ${label}`, { exact: true }).focus();
      await page.keyboard.press(key);
      await page.evaluate(() => scrollTo(0, 0));
      await settle(page);
    };
    await setRange('optical thickness', 'Home');
    const thin = await card.screenshot();
    await setRange('optical thickness', 'End');
    const thick = await card.screenshot();
    assert.equal(thin.equals(thick), false, 'native physical thickness changes refracted GPU imagery');
    await setRange('lens curvature', 'Home');
    const flat = await card.screenshot();
    await setRange('lens curvature', 'End');
    const curved = await card.screenshot();
    assert.equal(flat.equals(curved), false, 'analytic curved normals change actual lens refraction');
    await setRange('refractive index', 'Home');
    const noBending = await card.screenshot();
    await setRange('refractive index', 'End');
    assert.equal(noBending.equals(await card.screenshot()), false, 'IOR changes physical refraction');
    await setRange('colour dispersion', 'Home');
    const noDispersion = await card.screenshot();
    await setRange('colour dispersion', 'End');
    assert.equal(noDispersion.equals(await card.screenshot()), false, 'dispersion changes native spectral sampling');
    await setRange('lens rim width', 'Home');
    const narrowRim = await card.screenshot();
    await setRange('lens rim width', 'End');
    assert.equal(narrowRim.equals(await card.screenshot()), false, 'signed-distance rim width changes the refracting geometry');
    await setRange('lens liquid distortion', 'End');
    await setRange('lens liquid speed', 'End');
    await page.getByLabel('Motion', { exact: true }).selectOption('system');
    await page.evaluate(() => scrollTo(0, 0));
    await settle(page);
    const moving = await card.screenshot();
    await page.waitForTimeout(400);
    assert.equal(moving.equals(await card.screenshot()), false, 'bounded liquid distortion changes the actual physical lens');
    await page.getByLabel('Motion', { exact: true }).selectOption('reduce');
    await page.evaluate(() => scrollTo(0, 0));
    await settle(page);
    for (const background of ['dark', 'bright']) {
      await page.locator('.upet-studio-v2__canvas').evaluate((element, bright) => { element.style.background = bright ? '#f4f6fa' : '#050b16'; }, background === 'bright');
      await card.screenshot({ path: `/tmp/upet-stage4-liquid-glass-${background}-${width}.png` });
    }
    const reduced = await card.screenshot();
    await page.waitForTimeout(200);
    assert.equal(reduced.equals(await card.screenshot()), true, 'reduced motion has no decorative loop');
    let baseline;
    for (let cycle = 0; cycle < 4; cycle++) {
      await page.getByLabel('Preview quality', { exact: true }).selectOption('lite');
      await expect(card).toHaveAttribute('data-gpu-state', 'fallback');
      await settle(page);
      const allocations = await page.evaluate(() => window.__lensAllocations());
      if (!baseline) baseline = allocations;
      assert.deepEqual(allocations, baseline, 'native transmission targets/textures cannot accumulate across Lite cleanup');
      if (cycle === 0) await card.screenshot({ path: `/tmp/upet-stage4-liquid-glass-lite-${width}.png` });
      await page.getByLabel('Preview quality', { exact: true }).selectOption('balanced');
      await expect(card).toHaveAttribute('data-gpu-state', 'ready');
      await settle(page);
    }
    assert.equal(await card.getByRole('heading', { name: 'Preview User', exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('Liquid glass: real native volume transmission, curved normals/IOR/thickness/dispersion change GPU pixels; reduced motion, bright/dark/Lite, desktop/mobile and four framebuffer/texture cleanup cycles pass. Synthetic transport only; no HTML capture.');
} finally { await browser.close(); }
