export function summarize(visitors, at = new Date()) {
  const nonProfiles = new Set(['explore', 'marketplace', 'legal', 'privacy', 'terms', 'support', 'status', 'changelog', 'login', 'claim', 'dashboard', 'api', 'help-preview']);
  const dateKey = (value) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
  const day = dateKey(at);
  const today = visitors.filter((v) => v.lastAt && dateKey(v.lastAt) === day);
  const weekStart = at.getTime() - 7 * 86400000;
  const week = visitors.filter((v) => Date.parse(v.lastAt) >= weekStart);
  const count = (list, field) => Object.entries(list.reduce((out, v) => { const key = v[field] || 'Unknown'; out[key] = (out[key] || 0) + 1; return out; }, {})).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  return {
    live: visitors.filter((v) => Date.parse(v.lastAt) > at.getTime() - 5 * 60000).length,
    today: { visits: today.length, unique: new Set(today.map((v) => v.id)).size, pageViews: today.reduce((n, v) => n + (v.pageViews || 0), 0), conversions: today.filter((v) => v.conversion).length },
    week: { visits: week.length, pageViews: week.reduce((n, v) => n + (v.pageViews || 0), 0) },
    countries: count(week, 'country'), devices: count(week, 'device'), browsers: count(week, 'browser'), sources: count(week, 'source'),
    pages: Object.entries(week.flatMap((v) => v.events || []).filter((e) => e.type === 'page').reduce((out, e) => { out[e.route] = (out[e.route] || 0) + 1; return out; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, value]) => ({ name, value })),
    profiles: Object.entries(week.flatMap((v) => v.events || []).filter((e) => e.type === 'page' && /^\/[a-z0-9._-]+$/.test(e.route || '') && !nonProfiles.has(e.route.slice(1))).reduce((out, e) => { out[e.route] = (out[e.route] || 0) + 1; return out; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value })),
    funnel: { visits: week.length, signups: week.filter((v) => v.conversion).length },
    daily: Object.entries(week.reduce((out, v) => { const key = dateKey(v.lastAt); out[key] = (out[key] || 0) + 1; return out; }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, value })),
    network: { inspected: 0, vpn: 0, proxy: 0 }, security: { events: 0, bots: week.filter((v) => v.device === 'Bot').length },
  };
}
