import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { browserOf, countryOf, deviceOf, featureOf, referrerOf, routeOf } from '../server/visitorCore.js';
import { recordAggregate } from '../server/visitorAggregate.js';
import visitorHandler from '../api/visitor.js';
import adminHandler from '../api/visitor-admin.js';

const response = () => ({ statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; return this; }, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } });

test('aggregate route keys discard query strings and event payload details', () => {
  assert.equal(routeOf('/profile?email=private'), '/profile');
});

test('analytics dimensions are reduced to anonymous categories', () => {
  assert.equal(countryOf({ 'x-vercel-ip-country': 'gb' }), 'GB');
  assert.equal(countryOf({ 'x-vercel-ip-country': 'not-a-country' }), 'Unknown');
  assert.equal(deviceOf({ 'user-agent': 'Mozilla/5.0 (iPhone; Mobile)' }), 'Mobile');
  assert.equal(browserOf({ 'user-agent': 'Mozilla/5.0 Chrome/120 Safari/537.36' }), 'Chrome');
  assert.equal(referrerOf('https://www.google.com/search?q=userpet'), 'google.com');
  assert.equal(referrerOf('https://www.user.pet/explore'), 'Direct');
  assert.equal(featureOf('Music player'), 'Music player');
  assert.equal(featureOf('click to enter'), '');
  assert.equal(featureOf('Popular routes'), '');
});

test('aggregate recorder accepts only page, conversion, and named feature events', async () => {
  await assert.rejects(recordAggregate({}, { type: 'heartbeat', route: '/' }), /Invalid event/);
  await assert.rejects(recordAggregate({}, { type: 'feature', route: '/', feature: 'click to enter' }), /Invalid feature/);
  assert.equal(await recordAggregate({}, { type: 'page', route: '/deployment-check-production' }), null);
});

test('visitor intake rejects cross-origin writes and founder-only summaries require auth', async () => {
  const write = response();
  await visitorHandler({ method: 'POST', headers: { host: 'user.pet', origin: 'https://evil.example' }, body: { mode: 'aggregate', type: 'page', route: '/' } }, write);
  assert.equal(write.statusCode, 403);
  const read = response();
  await visitorHandler({ method: 'GET', headers: { host: 'user.pet' } }, read);
  assert.equal(read.statusCode, 401);
});

test('retired visitor bot endpoint is permanently disabled', async () => {
  const res = response();
  await adminHandler({ method: 'POST', headers: {}, body: { command: 'info' } }, res);
  assert.equal(res.statusCode, 410);
  assert.doesNotMatch(JSON.stringify(res.body), /ip|visitor details/i);
});

test('tracking and server aggregation do not access IP, identity, or Discord fields', async () => {
  const [tracking, intake, aggregate, dashboard] = await Promise.all([
    readFile(new URL('../src/redesign/components/VisitorTracking.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../api/visitor.js', import.meta.url), 'utf8'),
    readFile(new URL('../server/visitorAggregate.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/redesign/pages/dashboard/VisitorAnalytics.jsx', import.meta.url), 'utf8'),
  ]);
  for (const source of [tracking, intake, aggregate]) assert.doesNotMatch(source, /x-forwarded-for|x-real-ip|requestIp|VISITOR_DISCORD|discord\.com/i);
  assert.match(tracking, /data-testid\*="entry"/);
  assert.doesNotMatch(dashboard, /Start a 24-hour|visitor lookup|\/visitor claim/i);
  assert.doesNotMatch(dashboard, /Popular routes/i);
});
