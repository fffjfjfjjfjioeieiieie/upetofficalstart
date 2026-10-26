import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { expect } from 'playwright/test';

const origin = process.env.UPET_LOCAL_PREVIEW_ORIGIN || 'http://127.0.0.1:5174';
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('Visual verification must use localhost.');
const browser = await chromium.launch({ headless: true, ...(process.env.UPET_CHROMIUM_EXECUTABLE ? { executablePath: process.env.UPET_CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
const placeholder = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="#163347"/><circle cx="120" cy="120" r="60" fill="#70d7f3"/></svg>';
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    // The harness imports actual product components, but all external and API
    // requests are intercepted before the network. No real user data is read.
    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.resourceType() === 'image' && (url.origin !== origin || url.pathname.startsWith('/fixtures/'))) {
        return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: placeholder });
      }
      if (url.origin !== origin || url.pathname.startsWith('/api/')) return route.abort();
      if (url.pathname.startsWith('/fixtures/') || request.resourceType() === 'media') return route.fulfill({ status: 204 });
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${origin}/tests/profile-renderer-v2-harness.html`);
    await page.getByTestId('v2-public').locator('.upet-profile-renderer').waitFor();
    const publicView = page.getByTestId('v2-public');
    const ownerView = page.getByTestId('v2-owner');
    assert.equal(await publicView.locator('script').count(), 0);
    assert.equal(await publicView.getByText('<script>Rendered as text</script>', { exact: true }).count(), 1);
    assert.equal(await publicView.getByText(/not yet previewable/).count(), 0);
    assert.equal(await ownerView.getByText(/future-widget is preserved/).count(), 1);
    await publicView.locator('summary').click();
    await publicView.getByLabel('Visitor graphics quality', { exact: true }).selectOption('lite');
    await expect(publicView.locator('.upet-profile-renderer')).toHaveAttribute('data-quality', 'lite');
    await publicView.getByLabel('Visitor motion preference', { exact: true }).selectOption('reduce');
    await expect(publicView.locator('.upet-profile-renderer')).toHaveAttribute('data-reduced-motion', 'true');
    assert.equal(await page.locator('[data-testid^="legacy-"] .upet-profile-renderer').count(), 0, 'legacy uses its existing renderer');
    for (const username of ['night-sky', 'schema-user', 'complete-schema', 'redesign-user']) {
      assert.ok((await page.getByTestId(`legacy-${username}`).innerText()).length > 20);
    }
    assert.ok((await page.getByTestId('legacy-complete-schema').innerText()).includes('Schema User'));
    if (width === 390) await page.getByRole('button', { name: 'Viewport: desktop' }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `${width}px compatibility fixture overflow`);
    await page.screenshot({ path: `/tmp/upet-stage2-renderer-${width}.png`, fullPage: true });

    await page.goto(`${origin}/tests/studio-v2-harness.html`);
    await page.getByRole('button', { name: '+ heading', exact: true }).click();
    const canvas = page.getByRole('region', { name: 'Profile canvas' });
    await page.getByLabel('Heading', { exact: true }).fill('Shared renderer heading');
    await canvas.getByRole('heading', { name: 'Shared renderer heading' }).waitFor();
    await expect(canvas.getByRole('heading', { name: 'Shared renderer heading' })).toHaveCSS('font-size', '17px');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    assert.equal(await canvas.getByRole('heading', { name: 'A new heading' }).count(), 1);
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    assert.equal(await canvas.getByRole('heading', { name: 'Shared renderer heading' }).count(), 1);
    const selected = canvas.getByRole('button', { name: 'Select heading layer' });
    await selected.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByLabel('X position %', { exact: true })).toHaveValue('6');
    if (width === 390) await page.getByRole('button', { name: 'Mobile', exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px Studio overflow`);
    await page.screenshot({ path: `/tmp/upet-stage2-shared-studio-${width}.png`, fullPage: true });
    await context.close();
  }
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log('Profile renderer: desktop/mobile, three legacy shapes, escaped text, unknown blocks, Studio edit/undo/redo/nudge passed.');
} finally { await browser.close(); }
