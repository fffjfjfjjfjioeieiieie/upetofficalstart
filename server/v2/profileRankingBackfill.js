import { FieldPath } from 'firebase-admin/firestore';

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,19}$/;

export async function loadRankingBackfillPage(db, { cursor = null, pageSize = 20 } = {}) {
  const size = Math.max(1, Math.min(20, Math.floor(Number(pageSize) || 20)));
  let source = db.collection('directoryProfiles').orderBy(FieldPath.documentId());
  if (cursor) source = source.startAfter(cursor);
  const snapshot = await source.limit(size + 1).get();
  const documents = snapshot.docs.slice(0, size);
  const candidates = documents.filter((entry) => USERNAME_PATTERN.test(entry.id));
  const rows = await Promise.all(candidates.map(async (entry) => {
    const count = await db.collection('profileEvents').doc(entry.id)
      .collection('events').where('kind', '==', 'view').count().get();
    return Object.freeze({ username: entry.id, views: Math.max(0, Number(count.data()?.count) || 0) });
  }));
  return Object.freeze({
    rows,
    cursor: documents.at(-1) || null,
    hasMore: snapshot.docs.length > size,
  });
}

export async function applyRankingBackfillPage(db, rows, { dryRun = true } = {}) {
  if (dryRun) return Object.freeze({ created: 0, skipped: rows.length, dryRun: true });
  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    const reference = db.collection('profileRankingStats').doc(row.username);
    const changed = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) return false;
      transaction.create(reference, {
        username: row.username,
        views: row.views,
        clicks: 0,
        backfilledAtMs: Date.now(),
      });
      return true;
    });
    if (changed) created += 1;
    else skipped += 1;
  }
  return Object.freeze({ created, skipped, dryRun: false });
}
