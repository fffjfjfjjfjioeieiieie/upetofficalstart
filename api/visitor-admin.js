import { audit, database, diagnosticById, hash, recentVisitors, visitorById } from '../server/visitorStore.js';
import { botActor, limit } from '../server/visitorSecurity.js';
import { aggregateSummary } from '../server/visitorAggregate.js';
import { notifyDiagnostic, publicAccount } from '../server/visitorNotify.js';
import { Timestamp } from 'firebase-admin/firestore';

const fail = (res, status, error) => res.status(status).json({ error });
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  const actor = botActor(req);
  if (!actor) return fail(res, 403, 'Access denied.');
  try {
    if (!await limit(`bot:${actor}`, 25, 60000)) return fail(res, 429, 'Too many requests.');
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    const command = String(body.command || '');
    const visitorId = String(body.id || '');
    if (command === 'claim') {
      if (!/^[a-f0-9]{24}$/.test(visitorId)) return fail(res, 400, 'Invalid claim code.');
      const claimRef = database().collection('visitorClaims').doc(hash(visitorId));
      const claimedId = await database().runTransaction(async (tx) => {
        const claim = await tx.get(claimRef);
        if (!claim.exists || claim.data().expiresAt.toMillis() <= Date.now()) return null;
        const diagRef = database().collection('visitorDiagnostics').doc(claim.data().visitorId);
        const diag = await tx.get(diagRef);
        if (!diag.exists || diag.data().expiresAt.toMillis() <= Date.now() || diag.data().ownerUid !== claim.data().ownerUid || diag.data().discordId) return null;
        tx.update(diagRef, { discordId: actor });
        tx.delete(claimRef);
        return claim.data().visitorId;
      });
      if (!claimedId) return fail(res, 404, 'Claim code expired or not found.');
      await audit(actor, 'claim-diagnostic', claimedId);
      const claimed = await diagnosticById(claimedId);
      if (claimed) {
        let account = { signedIn: true };
        try { account = await publicAccount(claimed.ownerUid); }
        catch (error) { console.error('Diagnostic profile lookup failed:', error.message); }
        await notifyDiagnostic(claimed, account);
      }
      return res.status(200).json({ message: `Diagnostic test verified. Visitor ID: ${claimedId}` });
    }
    if (command === 'info' || command === 'network' || command === 'history') {
      const visitor = await visitorById(visitorId);
      if (!visitor) return fail(res, 404, 'Visitor not found.');
      const diagnostic = await diagnosticById(visitorId);
      if (command === 'history') {
        if (diagnostic) await audit(actor, 'history-diagnostic', visitorId);
        return res.status(200).json({ visitor: { id: visitor.id, events: visitor.events.slice(-30) } });
      }
      if (command === 'network') {
        if (!diagnostic) return res.status(200).json({ message: 'No enrolled diagnostic session for this visitor.' });
        await audit(actor, 'network', visitorId);
        return res.status(200).json({ diagnostic: { ip: diagnostic.ip, ipVersion: diagnostic.ipVersion, ...diagnostic.network } });
      }
      if (diagnostic) await audit(actor, 'info-diagnostic', visitorId);
      return res.status(200).json({ visitor, account: diagnostic ? await publicAccount(diagnostic.ownerUid) : null, diagnostic: diagnostic ? { ip: diagnostic.ip, ipVersion: diagnostic.ipVersion, ...diagnostic.network, timezone: diagnostic.timezone, language: diagnostic.language, screen: diagnostic.screen, viewport: diagnostic.viewport } : null });
    }
    if (command === 'myip') {
      const snap = await database().collection('visitorDiagnostics').where('discordId', '==', actor).limit(100).get();
      const diagnostics = snap.docs.map((doc) => doc.data()).filter((d) => d.expiresAt?.toMillis() > Date.now()).sort((a, b) => b.enrolledAt.toMillis() - a.enrolledAt.toMillis());
      const current = diagnostics[0];
      if (!current) return res.status(200).json({ message: 'No active diagnostic session is enrolled for this Discord account.' });
      await audit(actor, 'myip', current.visitorId);
      return res.status(200).json({ id: current.visitorId, ip: current.ip, ipVersion: current.ipVersion });
    }
    if (command === 'recent') {
      const visitors = await recentVisitors(15);
      return res.status(200).json({ recent: visitors.map(({ id, lastAt, route }) => ({ id, lastAt, route })) });
    }
    const summary = await aggregateSummary();
    if (command === 'security') {
      const limited = await database().collection('visitorRateLimits').where('updatedAt', '>=', Timestamp.fromMillis(Date.now() - 7 * 86400000)).limit(500).get();
      summary.security.events += limited.docs.reduce((n, d) => n + (d.data().blocked || 0), 0);
    }
    if (['live', 'today', 'countries', 'security'].includes(command)) return res.status(200).json({ [command]: summary[command] });
    return fail(res, 400, 'Unknown command.');
  } catch (error) {
    console.error('Visitor admin request failed:', error);
    return fail(res, 500, 'Visitor admin request failed.');
  }
}
