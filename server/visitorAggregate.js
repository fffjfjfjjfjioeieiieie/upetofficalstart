import { createHash } from 'node:crypto';
import { database, expiry, id, now } from './visitorStore.js';
import { clean, routeOf, sourceOf, userAgent } from './visitorCore.js';

const registers = 64;
const dateKey = (at) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
const bucketKey = (at) => Math.floor(at.getTime() / 300000);
const syntheticRoute = (route) => /^\/deployment-check(?:[-/]|$)/.test(route);
export const sketch = (bytes, prior = []) => {
  const result = Array.from({ length: registers }, (_, i) => prior[i] || 0);
  const index = bytes[0] & 63;
  let rank = 1;
  for (let bit = 8; bit < 256 && ((bytes[bit >> 3] >> (7 - (bit & 7))) & 1) === 0; bit++) rank++;
  result[index] = Math.max(result[index], rank);
  return result;
};
export const estimate = (values) => {
  const sum = values.reduce((n, v) => n + 2 ** -v, 0);
  const raw = 0.709 * registers * registers / sum;
  const zero = values.filter((v) => v === 0).length;
  return Math.round(raw <= 2.5 * registers && zero ? registers * Math.log(registers / zero) : raw);
};
export const union = (docs) => Array.from({ length: registers }, (_, i) => Math.max(0, ...docs.map((d) => d.hll?.[i] || 0)));
const increase = (map = {}, key, count = 1) => {
  const safeKey = key in map || Object.keys(map).length < 100 ? key : 'Other';
  return { ...map, [safeKey]: (map[safeKey] || 0) + count };
};

export async function recordAggregate(request, body, ip, signedIn = false) {
  const at = new Date();
  const type = ['page', 'navigation', 'conversion', 'error', 'heartbeat'].includes(body?.type) ? body.type : null;
  if (!type) throw new Error('Invalid event.');
  const route = routeOf(body.route);
  if (syntheticRoute(route)) return null;
  const identity = createHash('sha256').update(`${process.env.VISITOR_RATE_SALT || 'aggregate'}:${ip || 'unknown'}`).digest();
  const shard = identity[1] & 15;
  const daily = database().collection('visitorDaily').doc(`${dateKey(at)}-${shard}`);
  const live = database().collection('visitorLive').doc(`${bucketKey(at) % 4}-${shard}`);
  const { device, browser } = userAgent(request.headers['user-agent']);
  const source = sourceOf(body.referrer);
  const country = clean(request.headers['x-vercel-ip-country'], 2) || 'Unknown';
  const write = async (ref, kind) => database().runTransaction(async (tx) => {
    const stored = (await tx.get(ref)).data() || {};
    const old = kind === 'live' && stored.bucket !== bucketKey(at) ? {} : stored;
    const next = { ...old, hll: sketch(identity, old.hll), updatedAt: now(), expiresAt: expiry(kind === 'daily' ? 90 * 86400000 : 86400000) };
    if (kind === 'daily') {
      next.day = dateKey(at);
      next.pageViews = (old.pageViews || 0) + (type === 'page' ? 1 : 0);
      next.signedInPageViews = (old.signedInPageViews || 0) + (type === 'page' && signedIn ? 1 : 0);
      next.conversions = (old.conversions || 0) + (type === 'conversion' ? 1 : 0);
      next.errors = (old.errors || 0) + (type === 'error' ? 1 : 0);
      if (type === 'page') {
        next.pages = increase(old.pages, route);
        next.countries = increase(old.countries, country);
        next.devices = increase(old.devices, device);
        next.browsers = increase(old.browsers, browser);
        next.sources = increase(old.sources, source);
      }
    } else next.bucket = bucketKey(at);
    tx.set(ref, next);
  });
  await Promise.all([write(daily, 'daily'), write(live, 'live')]);
  return { id: id().slice(0, 12), route, device };
}

export async function aggregateSummary() {
  const db = database();
  const start = dateKey(new Date(Date.now() - 6 * 86400000));
  const [days, live] = await Promise.all([
    db.collection('visitorDaily').where('day', '>=', start).limit(500).get(),
    db.collection('visitorLive').where('bucket', '>=', bucketKey(new Date()) - 1).limit(64).get(),
  ]);
  const entries = days.docs.map((d) => d.data());
  const today = dateKey(new Date());
  const todayRows = entries.filter((d) => d.day === today);
  const add = (rows, key) => rows.reduce((n, row) => n + (row[key] || 0), 0);
  const combine = (key) => {
    const totals = {};
    entries.forEach((row) => Object.entries(row[key] || {}).forEach(([name, value]) => { totals[name] = (totals[name] || 0) + value; }));
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([name, value]) => ({ name, value }));
  };
  const byDay = entries.reduce((out, row) => { (out[row.day] ||= []).push(row); return out; }, {});
  const daily = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([name, rows]) => ({ name, value: estimate(union(rows)) }));
  const pageViews = add(entries, 'pageViews');
  return {
    live: estimate(union(live.docs.map((d) => d.data()))),
    today: { visits: estimate(union(todayRows)), unique: estimate(union(todayRows)), pageViews: add(todayRows, 'pageViews'), signedInPageViews: add(todayRows, 'signedInPageViews'), conversions: add(todayRows, 'conversions') },
    week: { visits: daily.reduce((n, d) => n + d.value, 0), pageViews }, daily,
    countries: combine('countries'), devices: combine('devices'), browsers: combine('browsers'), sources: combine('sources'),
    pages: combine('pages').filter((d) => !syntheticRoute(d.name)), profiles: combine('pages').filter((d) => /^\/[a-z0-9._-]+$/.test(d.name) && !syntheticRoute(d.name) && !['/login', '/privacy', '/explore', '/marketplace', '/claim'].includes(d.name)),
    funnel: { visits: daily.reduce((n, d) => n + d.value, 0), signups: add(entries, 'conversions') },
    security: { events: add(entries, 'errors'), bots: combine('devices').find((d) => d.name === 'Bot')?.value || 0 },
    partial: days.size >= 500,
  };
}
