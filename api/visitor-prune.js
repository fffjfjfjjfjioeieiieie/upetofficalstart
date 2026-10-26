import { database, now } from '../server/visitorStore.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(403).json({ error: 'Access denied.' });
  try {
    const db = database();
    let deleted = 0;
    // Remove legacy identity-bearing records left by the retired diagnostic
    // tracker. New aggregates are retained only until their expiry.
    for (const name of ['visitorDiagnostics', 'visitorSessions', 'visitorClaims', 'visitorAudit', 'visitorRateLimits', 'visitorLive']) {
      let remaining = true;
      while (remaining) {
        const old = await db.collection(name).limit(400).get();
        if (old.empty) { remaining = false; continue; }
        const batch = db.batch();
        old.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deleted += old.size;
      }
    }
    const expiredDaily = await db.collection('visitorDaily').where('expiresAt', '<=', now()).limit(400).get();
    if (!expiredDaily.empty) {
      const batch = db.batch();
      expiredDaily.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      deleted += expiredDaily.size;
    }
    return res.status(200).json({ deleted });
  } catch (error) {
    console.error('Visitor pruning failed:', error);
    return res.status(500).json({ error: 'Pruning failed.' });
  }
}
