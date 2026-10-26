import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { expect } from 'playwright/test';

const origin = process.env.UPET_LOCAL_PREVIEW_ORIGIN || 'http://127.0.0.1:5174';
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('Graphics checks must use localhost.');
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  ...(process.env.UPET_CHROMIUM_EXECUTABLE ? { executablePath: process.env.UPET_CHROMIUM_EXECUTABLE } : {}),
});
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('upet.graphics.v1')) localStorage.setItem('upet.graphics.v1', JSON.stringify({ quality: 'lite', motion: 'system' }));
    window.__graphicsCalls = 0;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2') window.__graphicsCalls += 1;
      return original.call(this, type, ...args);
    };
  });
  const page = await context.newPage();
  await context.tracing.start({ screenshots: false, snapshots: false, sources: false });
  page.on('pageerror', (error) => errors.push(error.message));
  const threeRequests = [];
  page.on('request', (request) => { if (/\/three[./-]/.test(request.url())) threeRequests.push(request.url()); });
  await page.goto(`${origin}/tests/graphics-v2-harness.html`);
  await page.getByRole('heading', { name: 'Native content 3', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.__graphicsCalls), 0, 'initial Lite must not create a GPU context');
  assert.equal(threeRequests.length, 0, 'initial Lite must not download Three.js');
  await page.screenshot({ path: '/tmp/upet-stage3-graphics-lite.png', fullPage: false });
  await page.getByLabel('Graphics quality', { exact: true }).selectOption('balanced');
  await page.waitForFunction(() => document.querySelectorAll('[data-layer-state="ready"]').length === 3);
  const diagnostics = () => page.evaluate(() => window.__upetGraphics.engines.at(-1).diagnostics());
  let state = await diagnostics();
  assert.equal(state.contextCount, 1);
  assert.equal(state.resources.entries, 1, 'all scenes share one geometry');
  assert.equal(state.resources.references, 3);
  assert.equal(state.memory.geometries, 1);

  for (const [tier, pixels, dpr] of [['balanced', 1_500_000, 1.25], ['high', 3_000_000, 1.75], ['ultra', 4_000_000, 2]]) {
    await page.getByLabel('Graphics quality', { exact: true }).selectOption(tier);
    await page.waitForFunction((value) => window.__upetGraphics.manager.state().tier === value, tier);
    const before = (await diagnostics()).scheduler.frames;
    await page.waitForFunction((frames) => window.__upetGraphics.engines.at(-1).diagnostics().scheduler.frames > frames, before);
    state = await diagnostics();
    assert.ok(state.pixelWidth * state.pixelHeight <= pixels, `${tier} pixel budget`);
    const cssWidth = await page.locator('.upet-graphics-host__canvas').evaluate((node) => parseFloat(node.style.width));
    assert.ok(state.pixelWidth <= Math.ceil(cssWidth * dpr), `${tier} DPR cap`);
    await page.screenshot({ path: `/tmp/upet-stage3-graphics-${tier}.png`, fullPage: false });
  }

  const initialFrames = (await diagnostics()).scheduler.frames;
  await page.waitForFunction((frames) => window.__upetGraphics.engines.at(-1).diagnostics().scheduler.frames > frames + 120, initialFrames);
  const measured = await diagnostics();
  const frameTimes = measured.frameTimesMs.slice(-120).sort((a, b) => a - b);
  console.log(JSON.stringify({ benchmark: 'local diagnostic; software SwiftShader, three scenes, Ultra, DPR 3 requested', samples: frameTimes.length, p50FrameMs: frameTimes[60], p95FrameMs: frameTimes[114], pixels: measured.pixelWidth * measured.pixelHeight, gpuAllocations: measured.memory }));

  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForFunction(() => window.__upetGraphics.engines.at(-1).diagnostics().scheduler.paused);
  const offscreenFrames = (await diagnostics()).scheduler.frames;
  await page.waitForTimeout(100);
  assert.equal((await diagnostics()).scheduler.frames, offscreenFrames, 'offscreen scenes stop scheduling');
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => !window.__upetGraphics.engines.at(-1).diagnostics().scheduler.paused);

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => window.__upetGraphics.engines.at(-1).diagnostics().scheduler.paused);
  const hiddenFrames = (await diagnostics()).scheduler.frames;
  await page.waitForTimeout(100);
  assert.equal((await diagnostics()).scheduler.frames, hiddenFrames, 'hidden documents stop scheduling');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await page.getByLabel('Motion', { exact: true }).selectOption('reduce');
  await page.waitForFunction(() => {
    const state = window.__upetGraphics.engines.at(-1).diagnostics();
    return !state.scheduler.continuous && !state.scheduler.pending;
  });
  const reducedFrames = (await diagnostics()).scheduler.frames;
  await page.waitForTimeout(100);
  assert.equal((await diagnostics()).scheduler.frames, reducedFrames, 'reduced motion draws once, then stops');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('upet.graphics.v1'))), { quality: 'ultra', motion: 'reduce' });

  await page.evaluate(() => {
    window.__contextLoss = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
    if (!window.__contextLoss) throw Error('Context-loss extension is required for this check.');
    window.__contextLoss.loseContext();
  });
  await expect(page.locator('.upet-graphics-host')).toHaveAttribute('data-graphics-state', 'lost');
  assert.equal(await page.getByRole('heading', { name: 'Native content 1', exact: true }).count(), 1);
  assert.equal((await diagnostics()).resources.entries, 0);
  await page.screenshot({ path: '/tmp/upet-stage3-graphics-context-lost.png', fullPage: false });
  await page.waitForTimeout(100);
  await page.evaluate(() => window.__contextLoss.restoreContext());
  await page.waitForFunction(() => document.querySelectorAll('[data-layer-state="ready"]').length === 3);
  assert.equal((await diagnostics()).resources.entries, 1, 'restoration recreates exactly one shared resource');

  await page.getByRole('button', { name: 'Break one scene', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-layer-state="unavailable"]').length === 1);
  assert.equal(await page.locator('[data-layer-state="ready"]').count(), 2, 'one scene failure stays isolated');
  await page.getByRole('button', { name: 'Restore valid scene', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-layer-state="ready"]').length === 3);

  await page.getByRole('button', { name: 'Use twenty layers', exact: true }).click();
  await expect(page.locator('[data-layer-state="budget"]')).toHaveCount(8);
  assert.equal((await diagnostics()).layers, 12);
  assert.equal((await diagnostics()).contextCount, 1);
  await page.getByRole('button', { name: 'Use three layers', exact: true }).click();

  for (let cycle = 0; cycle < 4; cycle++) {
    await page.getByRole('button', { name: 'Unmount scene', exact: true }).click();
    await page.waitForFunction(() => window.__upetGraphics.graphicsContextCount() === 0);
    state = await diagnostics();
    assert.equal(state.status, 'disposed');
    assert.equal(state.resources.entries, 0);
    assert.equal(state.scheduler.disposed, true);
    assert.equal(state.scheduler.pending, false);
    await page.getByRole('button', { name: 'Mount scene', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-layer-state="ready"]').length === 3);
    assert.equal((await diagnostics()).memory.geometries, 1, 'remounts do not accumulate geometry');
  }
  await page.reload();
  await expect(page.getByLabel('Graphics quality', { exact: true })).toHaveValue('ultra');
  await expect(page.getByLabel('Motion', { exact: true })).toHaveValue('reduce');
  await page.getByLabel('Graphics quality', { exact: true }).selectOption('auto');
  await expect(page.getByLabel('Graphics quality', { exact: true })).toHaveValue('auto');
  console.log('GPU lifecycle: lazy Lite, three shared scenes, all tiers/DPR/pixel caps, offscreen/hidden/reduced-motion pause, context loss/restoration, isolated failure, layer budget and four cleanup cycles passed.');
  await context.tracing.stop({ path: '/tmp/upet-stage3-graphics-trace.zip' });
  await context.close();

  const disabled = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await disabled.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await disabled.addInitScript(() => {
    localStorage.setItem('upet.graphics.v1', JSON.stringify({ quality: 'high', motion: 'system' }));
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); };
  });
  const fallbackPage = await disabled.newPage();
  fallbackPage.on('pageerror', (error) => errors.push(error.message));
  await fallbackPage.goto(`${origin}/tests/graphics-v2-harness.html`);
  await expect(fallbackPage.locator('.upet-graphics-host')).toHaveAttribute('data-graphics-state', 'unavailable');
  assert.equal(await fallbackPage.getByRole('heading', { name: /Native content/ }).count(), 3);
  assert.equal(await fallbackPage.evaluate(() => window.__upetGraphics.manager.state().reducedMotion), true);
  assert.equal(await fallbackPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await fallbackPage.screenshot({ path: '/tmp/upet-stage3-graphics-webgl-disabled-mobile.png', fullPage: false });
  assert.deepEqual(errors, [], 'No fatal browser errors');
  console.log('WebGL-disabled mobile: native content, designed CSS fallback, reduced motion and no overflow passed.');
  await disabled.close();
} finally { await browser.close(); }
