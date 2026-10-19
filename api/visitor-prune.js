import { database, now } from '../server/visitorStore.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(403).json({ error: 'Access denied.' });
  try {
    const db = database();
    let deleted = 0;
    for (const name of ['visitorDiagnostics', 'visitorSessions', 'visitorClaims', 'visitorDaily', 'visitorLive', 'visitorAudit', 'visitorRateLimits']) {
      const expired = await db.collection(name).where('expiresAt', '<=', now()).limit(400).get();
      if (expired.empty) continue;
      const batch = db.batch();
      expired.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      deleted += expired.size;
    }
    return res.status(200).json({ deleted });
  } catch (error) {
    console.error('Visitor pruning failed:', error);
    return res.status(500).json({ error: 'Pruning failed.' });
  }
}
