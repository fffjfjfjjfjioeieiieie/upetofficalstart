import { FieldValue } from 'firebase-admin/firestore';
import { database, now, expiry } from './visitorStore.js';
import { browserOf, countryOf, deviceOf, featureOf, referrerOf, routeOf } from './visitorCore.js';

const dateKey = (at) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
const safeRoute = (value) => routeOf(value);
const ignoredRoute = (route) => /^\/deployment-check(?:[-/]|$)/.test(route);

// Stores daily aggregates only. Raw IP addresses, user agents,
// account identifiers, cookies, and individual visit records are never stored.
export async function recordAggregate(request, body) {
  const type = body?.type;
  if (!['page', 'conversion', 'feature'].includes(type)) throw new Error('Invalid event.');
  const feature = type === 'feature' ? featureOf(body.feature) : '';
  if (type === 'feature' && !feature) throw new Error('Invalid feature.');
  const route = safeRoute(body.route);
  if (ignoredRoute(route)) return null;
  const day = dateKey(new Date());
  const ref = database().collection('visitorDaily').doc(day);
  const increment = () => FieldValue.increment(1);
  const next = { day, updatedAt: now(), expiresAt: expiry(90 * 86400000) };
  if (type === 'page') {
    next.pageViews = increment();
    next.pages = { [route]: increment() };
    next.countries = { [countryOf(request.headers)]: increment() };
    next.devices = { [deviceOf(request.headers)]: increment() };
    next.browsers = { [browserOf(request.headers)]: increment() };
    next.referrers = { [referrerOf(body.referrer)]: increment() };
  }
  if (type === 'conversion') next.conversions = increment();
  if (type === 'feature') {
    next.featureClicks = increment();
    next.features = { [feature]: increment() };
  }
  await ref.set(next, { merge: true });
  return { route };
}

export async function aggregateSummary(requestedDays = 7) {
  const days = [7, 30, 90].includes(Number(requestedDays)) ? Number(requestedDays) : 7;
  const start = dateKey(new Date(Date.now() - (days * 2 - 1) * 86400000));
  const snapshot = await database().collection('visitorDaily').where('day', '>=', start).limit(100).get();
  const rows = snapshot.docs.map((doc) => doc.data());
  const today = dateKey(new Date());
  const periodStart = dateKey(new Date(Date.now() - (days - 1) * 86400000));
  const previousStart = dateKey(new Date(Date.now() - (days * 2 - 1) * 86400000));
  const currentRows = rows.filter((row) => row.day >= periodStart);
  const previousRows = rows.filter((row) => row.day >= previousStart && row.day < periodStart);
  const todayRows = currentRows.filter((row) => row.day === today);
  const sum = (list, key) => list.reduce((total, row) => total + (Number(row[key]) || 0), 0);
  const combine = (key, limit = 20) => {
    const result = {};
    for (const row of currentRows) for (const [name, count] of Object.entries(row[key] || {})) result[name] = (result[name] || 0) + Number(count || 0);
    return Object.entries(result).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, value]) => ({ name, value }));
  };
  const withUnknown = (key, fallback, limit) => {
    const result = combine(key, limit);
    const known = result.reduce((total, row) => total + row.value, 0);
    const missing = Math.max(0, sum(currentRows, 'pageViews') - known);
    return missing ? [...result, { name: fallback, value: missing }].sort((a, b) => b.value - a.value) : result;
  };
  const topPages = combine('pages');
  const byDay = new Map(currentRows.map((row) => [row.day, row]));
  const daily = Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86400000);
    const name = dateKey(date);
    const row = byDay.get(name);
    return { name, value: Number(row?.pageViews) || 0, featureClicks: Number(row?.featureClicks) || 0 };
  });
  const pageViews = sum(currentRows, 'pageViews');
  const conversions = sum(currentRows, 'conversions');
  const featureClicks = sum(currentRows, 'featureClicks');
  const previousPageViews = sum(previousRows, 'pageViews');
  const previousConversions = sum(previousRows, 'conversions');
  const previousFeatureClicks = sum(previousRows, 'featureClicks');
  const percentChange = (value, previous) => previous ? Math.round(((value - previous) / previous) * 1000) / 10 : value ? 100 : 0;
  return {
    range: { days, start: periodStart, end: today },
    today: { pageViews: sum(todayRows, 'pageViews'), conversions: sum(todayRows, 'conversions') },
    period: { pageViews, conversions, featureClicks, engagementRate: pageViews ? Math.round((featureClicks / pageViews) * 1000) / 10 : 0, averageDaily: Math.round(pageViews / days), viewsChange: percentChange(pageViews, previousPageViews), conversionsChange: percentChange(conversions, previousConversions), clicksChange: percentChange(featureClicks, previousFeatureClicks) },
    week: { pageViews, conversions },
    daily,
    pages: topPages,
    profiles: topPages.filter((row) => /^\/[a-z0-9._-]+$/.test(row.name) && !['/login', '/privacy', '/explore', '/marketplace', '/claim'].includes(row.name)),
    features: combine('features', 20),
    countries: withUnknown('countries', 'Unknown', 260),
    devices: withUnknown('devices', 'Unknown', 8),
    browsers: withUnknown('browsers', 'Unknown', 12),
    referrers: withUnknown('referrers', 'Unknown', 60),
    partial: snapshot.size >= 100,
  };
}
