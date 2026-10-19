import test from 'node:test';
import assert from 'node:assert/strict';
import { eventOf, routeOf, sourceOf, userAgent } from '../server/visitorCore.js';
import { summarize } from '../server/visitorAnalytics.js';
import { inspectIp } from '../server/visitorIp.js';
import { publicVisitor } from '../server/visitorStore.js';
import { botActor } from '../server/visitorSecurity.js';
import { diagnosticBody, notificationBody } from '../server/visitorNotify.js';
import { estimate, recordAggregate, sketch, union } from '../server/visitorAggregate.js';
import { createHash } from 'node:crypto';
import { rankTopProfiles } from '../server/topProfiles.js';
import visitorHandler from '../api/visitor.js';
import adminHandler from '../api/visitor-admin.js';
import pruneHandler from '../api/visitor-prune.js';

const response = () => ({ statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; return this; }, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } });

test('tracking drops query strings and records bounded route events', () => {
  assert.equal(routeOf('/user?token=private'), '/user');
  assert.equal(eventOf({ type: 'page', route: '/profile?email=private' }).route, '/profile');
  assert.equal(eventOf({ type: 'unknown', route: '/' }), null);
  assert.equal(sourceOf('https://search.example/path'), 'search.example');
  assert.equal(userAgent('Mozilla/5.0 (iPhone) Safari/605.1').device, 'Mobile');
});

test('aggregate sketch estimates unique requests without retaining identifiers', () => {
  const hashes = Array.from({ length: 200 }, (_, i) => createHash('sha256').update(`sample-${i}`).digest());
  const first = hashes.slice(0, 100).reduce((hll, bytes) => sketch(bytes, hll), []);
  const second = hashes.slice(50, 150).reduce((hll, bytes) => sketch(bytes, hll), []);
  assert.ok(Math.abs(estimate(first) - 100) < 35);
  assert.ok(Math.abs(estimate(union([{ hll: first }, { hll: second }])) - 150) < 45);
});

test('deployment check routes do not enter visitor aggregates', async () => {
  const request = { headers: { 'user-agent': 'test' } };
  assert.equal(await recordAggregate(request, { type: 'page', route: '/deployment-check-production' }, '203.0.113.10'), null);
});

test('top profiles rank all-time views with stable ties', () => {
  assert.deepEqual(rankTopProfiles([
    { username: 'third', views: 2 }, { username: 'first', views: 10 },
    { username: 'second', views: 4 }, { username: 'invalid/name', views: 100 },
    { username: 'fourth', views: 2 },
  ]).map((row) => row.username), ['first', 'second', 'fourth']);
});

test('ordinary visitor projection does not include full IP or owner data', () => {
  const result = publicVisitor({ id: 'abc', ip: '203.0.113.10', ownerUid: 'private', route: '/', events: [] });
  assert.equal(result.ip, undefined);
  assert.equal(result.ownerUid, undefined);
});

test('aggregate Discord embed excludes individual visitor details', () => {
  const content = JSON.stringify(notificationBody({ today: { visits: 4, pageViews: 7, signedInPageViews: 3 }, live: 2, pages: [{ name: '/', value: 7 }] }));
  assert.match(content, /Visitor pulse/);
  assert.match(content, /Signed-in page views/);
  assert.doesNotMatch(content, /203\.0\.113\.10|private@example\.com|abcdef012345678901234567/);
});

test('claimed diagnostic embed shows IP and public profile preview', () => {
  const content = JSON.stringify(diagnosticBody({ visitorId: 'abcdef012345678901234567', ip: '203.0.113.10', ipVersion: 4, network: { city: 'London', isp: 'Example ISP' } }, { signedIn: true, username: 'lamp', displayName: 'Lamp', url: 'https://www.user.pet/lamp', avatar: 'https://www.user.pet/avatar.png' }));
  assert.match(content, /203\.0\.113\.10/);
  assert.match(content, /user\.pet\/lamp/);
  assert.match(content, /avatar\.png/);
});

test('unauthorised requests are rejected before database access', async () => {
  const visitor = response();
  await visitorHandler({ method: 'POST', headers: { host: 'user.pet', origin: 'https://evil.example' }, body: { consent: true, type: 'page' } }, visitor);
  assert.equal(visitor.statusCode, 403);
  const withoutAuth = response();
  await visitorHandler({ method: 'POST', headers: { host: 'user.pet', origin: 'https://user.pet' }, body: { mode: 'diagnostic', type: 'page' } }, withoutAuth);
  assert.equal(withoutAuth.statusCode, 401);
  const admin = response();
  await adminHandler({ method: 'POST', headers: {}, body: { command: 'info', id: 'abcdef012345678901234567' } }, admin);
  assert.equal(admin.statusCode, 403);
  const cron = response();
  await pruneHandler({ method: 'GET', headers: {} }, cron);
  assert.equal(cron.statusCode, 403);
});

test('UK daily analytics count visits, pages, conversions and bots', () => {
  const visitors = [{ id: 'a', firstAt: '2026-10-19T08:00:00Z', lastAt: '2026-10-19T09:00:00Z', route: '/', country: 'GB', device: 'Desktop', browser: 'Firefox', source: 'Direct', pageViews: 2, conversion: true, events: [{ type: 'page', route: '/' }, { type: 'page', route: '/lamp' }] }, { id: 'b', firstAt: '2026-10-19T09:00:00Z', lastAt: '2026-10-19T10:00:00Z', route: '/', country: 'GB', device: 'Bot', browser: 'Other', source: 'Direct', pageViews: 1, conversion: false, events: [] }];
  const result = summarize(visitors, new Date('2026-10-19T10:00:30Z'));
  assert.deepEqual(result.today, { visits: 2, unique: 2, pageViews: 3, conversions: 1 });
  assert.equal(result.live, 1);
  assert.equal(result.security.bots, 1);
  assert.equal(result.profiles[0].name, '/lamp');
});

test('bot access requires matching secret and allowlisted ID', () => {
  const before = { ...process.env };
  process.env.VISITOR_BOT_SECRET = 'test-secret';
  process.env.DISCORD_ADMIN_IDS = '123,456';
  try {
    assert.equal(botActor({ headers: { 'x-visitor-bot-secret': 'test-secret', 'x-discord-admin-id': '123' } }), '123');
    assert.equal(botActor({ headers: { 'x-visitor-bot-secret': 'test-secret', 'x-discord-admin-id': '789' } }), null);
    assert.equal(botActor({ headers: { 'x-visitor-bot-secret': 'wrong', 'x-discord-admin-id': '123' } }), null);
  } finally { process.env = before; }
});

test('proxycheck v3 network intelligence maps to diagnostic fields', async () => {
  const prior = globalThis.fetch;
  const key = process.env.PROXYCHECK_API_KEY;
  process.env.PROXYCHECK_API_KEY = 'test-key';
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ status: 'ok', '203.0.113.10': { network: { asn: 'AS123', provider: 'Example ISP', organisation: 'Example Org', type: 'Hosting' }, location: { city_name: 'London', region_name: 'England', country_name: 'United Kingdom' }, detections: { vpn: true, proxy: false, tor: false, hosting: true, confidence: 91 }, operator: { name: 'Example VPN' } } }) });
  try {
    const result = await inspectIp('203.0.113.10');
    assert.equal(result.ip, undefined);
    assert.equal(result.vpn, true);
    assert.equal(result.proxy, false);
    assert.equal(result.asn, 'AS123');
    assert.equal(result.confidence, 91);
    assert.equal(result.city, 'London');
  } finally { globalThis.fetch = prior; if (key === undefined) delete process.env.PROXYCHECK_API_KEY; else process.env.PROXYCHECK_API_KEY = key; }
});

test('diagnostic network lookup works within the provider keyless allowance', async () => {
  const prior = globalThis.fetch;
  const key = process.env.PROXYCHECK_API_KEY;
  delete process.env.PROXYCHECK_API_KEY;
  let requested;
  globalThis.fetch = async (url) => { requested = String(url); return { ok: true, json: async () => ({ '203.0.113.10': { network: { asn: 'AS123' }, detections: { vpn: false } } }) }; };
  try {
    assert.equal((await inspectIp('203.0.113.10')).asn, 'AS123');
    assert.ok(!new URL(requested).searchParams.has('key'));
  } finally { globalThis.fetch = prior; if (key !== undefined) process.env.PROXYCHECK_API_KEY = key; }
});
