import { database, diagnosticById, expiry, id, now, recentVisitors, hash } from '../server/visitorStore.js';
import { Timestamp } from 'firebase-admin/firestore';
import { inspectIp, requestIp } from '../server/visitorIp.js';
import { routeOf, clean, userAgent, sourceOf, eventOf, SID_PATTERN } from '../server/visitorCore.js';
import { founder, limit, sameOrigin } from '../server/visitorSecurity.js';
import { notifyVisitor } from '../server/visitorNotify.js';
import { aggregateSummary, recordAggregate } from '../server/visitorAggregate.js';
import { bearerToken, verifyFirebaseIdentity } from '../server/firebaseAuth.js';

const cookieSid = (req) => String(req.headers.cookie || '').split(';').map((x) => x.trim()).find((x) => x.startsWith('upet_vid='))?.slice(9) || '';
const bodyOf = (req) => typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
const cookie = (value, age) => `upet_vid=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${age}`;
const fail = (res, status, error) => res.status(status).json({ error });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      await founder(req);
      if (!await limit(`admin:${req.headers.authorization}`, 30, 60000)) return fail(res, 429, 'Too many requests.');
      const visitors = await recentVisitors();
      const summary = await aggregateSummary();
      const diagnostics = await database().collection('visitorDiagnostics').where('expiresAt', '>', now()).limit(500).get();
      const active = diagnostics.docs.map((d) => d.data()).filter((d) => !d.revoked);
      summary.network = { inspected: active.length, vpn: active.filter((d) => d.network?.vpn).length, proxy: active.filter((d) => d.network?.proxy).length };
      const limited = await database().collection('visitorRateLimits').where('updatedAt', '>=', Timestamp.fromMillis(Date.now() - 7 * 86400000)).limit(500).get();
      summary.security.events += limited.docs.reduce((n, d) => n + (d.data().blocked || 0), 0);
      return res.status(200).json({ summary, recent: visitors.slice(0, 30) });
    }
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) return fail(res, 405, 'Method not allowed.');
    if (!sameOrigin(req)) return fail(res, 403, 'Invalid origin.');
    const body = bodyOf(req);
    if (Number(req.headers['content-length'] || 0) > 2048) return fail(res, 413, 'Request is too large.');
    if (req.method === 'PATCH') {
      const sid = cookieSid(req);
      if (SID_PATTERN.test(sid)) {
        await database().collection('visitorSessions').doc(sid).delete();
        await database().collection('visitorDiagnostics').doc(sid).delete();
      }
      res.setHeader('Set-Cookie', cookie('', 0));
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'PUT' || req.method === 'DELETE') {
      const account = await founder(req);
      const existing = cookieSid(req);
      const sid = SID_PATTERN.test(existing) ? existing : id();
      if (req.method === 'DELETE') {
        const current = await database().collection('visitorDiagnostics').doc(sid).get();
        if (current.exists && current.data().ownerUid !== account.uid) return fail(res, 403, 'This diagnostic session belongs to another account.');
        await database().collection('visitorDiagnostics').doc(sid).delete();
        await database().collection('visitorSessions').doc(sid).delete();
        res.setHeader('Set-Cookie', cookie('', 0));
        return res.status(200).json({ ok: true });
      }
      if (!await limit(`enroll:${account.uid}`, 10, 3600000)) return fail(res, 429, 'Too many enrollment attempts.');
      const ip = requestIp(req);
      if (!ip) return fail(res, 400, 'Public IP is unavailable.');
      const network = await inspectIp(ip);
      const prior = await database().collection('visitorDiagnostics').doc(sid).get();
      if (prior.exists && prior.data().ownerUid !== account.uid) return fail(res, 403, 'This diagnostic session belongs to another account.');
      const route = routeOf(body.route || '/dashboard/visitors');
      const agent = userAgent(req.headers['user-agent']);
      await database().collection('visitorSessions').doc(sid).set({ id: sid, firstAt: now(), lastAt: now(), expiresAt: expiry(86400000), route, pageViews: 1, country: clean(req.headers['x-vercel-ip-country'], 2) || 'Unknown', ...agent, source: 'Direct', utm: {}, durationSeconds: 0, conversion: false, events: [{ type: 'page', route, at: new Date().toISOString() }] });
      const diagnostic = { visitorId: sid, ownerUid: account.uid, discordId: '', ip, ipVersion: ip.includes(':') ? 6 : 4, network, timezone: clean(body.timezone, 80), language: clean(body.language, 40), screen: clean(body.screen, 40), viewport: clean(body.viewport, 40), enrolledAt: now(), expiresAt: expiry(86400000) };
      await database().collection('visitorDiagnostics').doc(sid).set(diagnostic);
      const code = id();
      await database().collection('visitorClaims').doc(hash(code)).set({ visitorId: sid, ownerUid: account.uid, expiresAt: expiry(600000) });
      res.setHeader('Set-Cookie', cookie(sid, 86400));
      return res.status(200).json({ id: sid, claimCode: code, expiresAt: diagnostic.expiresAt.toDate().toISOString(), networkStatus: network.status });
    }
    if (req.method === 'POST' && body.mode === 'aggregate') {
      const ip = requestIp(req);
      if (!await limit(`ingest:${hash(ip || 'unknown')}`, 100, 60000)) return fail(res, 429, 'Too many requests.');
      let signedIn = false;
      if (body.type === 'page' && bearerToken(req)) {
        try { signedIn = !!(await verifyFirebaseIdentity(bearerToken(req))); } catch { /* Unverified visits remain anonymous. */ }
      }
      await recordAggregate(req, body, ip, signedIn);
      if (body.type === 'page') await notifyVisitor();
      return res.status(200).json({ recorded: true });
    }
    await founder(req);
    if (body.mode !== 'diagnostic') return fail(res, 400, 'Invalid tracking mode.');
    const sid = cookieSid(req);
    if (!SID_PATTERN.test(sid) || !await diagnosticById(sid)) return fail(res, 403, 'No active verified diagnostic test.');
    const event = eventOf(body);
    if (!event) return fail(res, 400, 'Invalid event.');
    const ip = requestIp(req);
    if (!await limit(`ingest:${hash(ip || 'unknown')}`, 100, 60000)) return fail(res, 429, 'Too many requests.');
    const collection = database().collection('visitorSessions');
    const ref = collection.doc(sid);
    const agent = userAgent(req.headers['user-agent']);
    let visitor;
    await database().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const previous = snap.data();
      const active = previous?.expiresAt?.toMillis() > Date.now();
      if (active && previous.lastAt?.toMillis() > Date.now() - 1000) return;
      const durationSeconds = active ? Math.min(86400, Math.max(0, Math.floor((Date.now() - previous.firstAt.toMillis()) / 1000))) : 0;
      visitor = {
        id: sid, firstAt: active ? previous.firstAt : now(), lastAt: now(), expiresAt: expiry(86400000),
        route: event.route, pageViews: (active ? previous.pageViews : 0) + (event.type === 'page' ? 1 : 0),
        country: active ? previous.country : clean(req.headers['x-vercel-ip-country'], 2) || 'Unknown',
        ...agent, source: active ? previous.source : sourceOf(body.referrer),
        utm: active ? previous.utm : { source: clean(body.utm?.source, 50), medium: clean(body.utm?.medium, 50), campaign: clean(body.utm?.campaign, 50) },
        durationSeconds, conversion: (active && previous.conversion) || event.type === 'conversion',
        events: [...(active ? previous.events || [] : []), event].slice(-100),
      };
      tx.set(ref, visitor);
    });
    res.setHeader('Set-Cookie', cookie(sid, 86400));
    return res.status(200).json({ id: sid, recorded: !!visitor });
  } catch (error) {
    console.error('Visitor API error:', error);
    return fail(res, /Sign in|cannot manage/.test(error.message) ? 401 : 500, 'Visitor request failed.');
  }
}
