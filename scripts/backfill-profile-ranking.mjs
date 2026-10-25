import { database } from '../server/visitorStore.js';
import { applyRankingBackfillPage, loadRankingBackfillPage } from '../server/v2/profileRankingBackfill.js';

const apply = process.argv.includes('--apply');
const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (apply && !emulator && process.env.UPET_PRODUCTION_RANKING_BACKFILL_ACK !== 'backfill-before-rollout') {
  throw new Error('Production backfill requires the reviewed migration acknowledgement.');
}

const db = database();
let cursor = null;
let pages = 0;
let candidates = 0;
let created = 0;
let skipped = 0;
do {
  const page = await loadRankingBackfillPage(db, { cursor });
  const result = await applyRankingBackfillPage(db, page.rows, { dryRun: !apply });
  pages += 1;
  candidates += page.rows.length;
  created += result.created;
  skipped += result.skipped;
  cursor = page.hasMore ? page.cursor : null;
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', pages, candidates, created, skipped, hasMore: Boolean(cursor) }));
} while (cursor);
