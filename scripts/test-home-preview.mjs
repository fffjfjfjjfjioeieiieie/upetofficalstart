/** Hosted-only Playwright smoke suite. It refuses loopback URLs. */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL =
  process.env.HOME_PREVIEW_URL ||
  'https://upet-c480b--homepage-rethink-fe5l04ab.web.app';
if (/localhost|127\.0\.0\.1/i.test(baseURL)) {
  throw new Error('Homepage browser tests must run against a hosted preview.');
}
await mkdir('artifacts/home-pass4/after', { recursive: true });
const browser = await chromium.launch({ headless: true });
for (const width of [375, 768, 1440, 1920]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type()))
      errors.push(`${message.type()}: ${message.text()}`);
  });
  page.on('requestfailed', (request) =>
    errors.push(`request failed: ${request.url()}`),
  );
  const response = await page.goto(baseURL, { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error(`${width}px page returned ${response?.status()}`);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `artifacts/home-pass4/after/${width}.png`,
    fullPage: true,
  });
  if (errors.length) throw new Error(`${width}px browser errors:\n${errors.join('\n')}`);
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.locator('a[href="#playground"]').first().click();
await page.locator('#playground').waitFor({ state: 'visible' });
await page.getByRole('button', { name: 'Underwater' }).click();
if (!page.url().includes('bg=underwater')) throw new Error('Playground did not update the design hash.');
await page.locator('a[href="#faq"]').first().click();
await page.locator('#faq button').first().waitFor();
await page.locator('#faq button').nth(1).focus();
await page.keyboard.press('Enter');
if ((await page.locator('#faq button').nth(1).getAttribute('aria-expanded')) !== 'true')
  throw new Error('FAQ did not open from the keyboard.');
await page.locator('a[href="#donations"]').first().click();
await page.locator('#donations form').waitFor();
await page.locator('#donations').evaluate((node) => node.scrollIntoView());
const donationsVisible = await page.locator('#donations').evaluate((node) => {
  const box = node.getBoundingClientRect();
  return box.top < innerHeight && box.bottom > 0;
});
if (!donationsVisible) throw new Error('Donations nav did not land on the section.');
const paymentRequests = [];
page.on('request', (request) => {
  if (/stripe|checkout|\/api\//i.test(request.url())) paymentRequests.push(request.url());
});
await page.locator('#donations').getByRole('button', { name: /Send thanks/ }).click();
await page.getByText('Thanks sent').waitFor();
if (paymentRequests.length) throw new Error(`Donation demo made network calls: ${paymentRequests.join(', ')}`);
await browser.close();
console.log(`Hosted homepage checks passed at ${baseURL}`);
