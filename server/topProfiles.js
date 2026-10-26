import { database } from './visitorStore.js';
import { profileName } from '../src/shared/profileIdentity.js';

const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,19}$/;
const text = (value, length = 120) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, length);
const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;
const asset = (value) => {
  const url = text(value, 2048);
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try { return ['http:', 'https:'].includes(new URL(url).protocol) ? url : ''; }
  catch { return ''; }
};
const media = (value) => ({
  src: asset(value?.src), type: text(value?.type, 40),
  zoom: Number.isFinite(Number(value?.zoom)) ? Math.max(0.25, Math.min(4, Number(value.zoom))) : 1,
  x: Number.isFinite(Number(value?.x)) ? Math.max(0, Math.min(100, Number(value.x))) : 50,
  y: Number.isFinite(Number(value?.y)) ? Math.max(0, Math.min(100, Number(value.y))) : 50,
});

export function rankTopProfiles(rows, limit = 100) {
  return rows.filter((row) => usernamePattern.test(row.username) && Number.isFinite(row.views) && row.views >= 0)
    .sort((a, b) => b.views - a.views || a.username.localeCompare(b.username))
    .slice(0, Math.max(1, Math.min(100, Number(limit) || 100)));
}

function compactProfile(username, views, document, directory) {
  const profile = document?.published?.redesign;
  if (document?.status !== 'published' || !profile) return null;
  return {
    username, views,
    displayName: text(profileName(profile.displayName || directory.displayName, username), 40),
    alias: text(profileName(profile.alias || directory.alias, username), 40),
    bio: text(profile.bio, 180),
    avatar: media(profile.media?.avatar || directory.avatar),
    banner: media(profile.media?.banner),
    background: media(profile.media?.background),
    badges: Array.isArray(directory.badges) ? directory.badges.map((badge) => text(badge, 32)).slice(0, 3) : [],
    linkCount: Array.isArray(profile.links) ? profile.links.length : 0,
    card: {
      layout: ['minimal', 'compact', 'banner', 'slideshow'].includes(profile.card?.layout) ? profile.card.layout : 'minimal',
      accent: color(profile.card?.accent, '#6cc4ff'),
      bgColor: color(profile.card?.bgColor, '#07111f'),
      cardColor: color(profile.card?.cardColor, '#0b1626'),
    },
  };
}

const SNAPSHOT_TTL_MS = 5 * 60 * 1000;
const REFRESH_LEASE_MS = 2 * 60 * 1000;
const LOCAL_TTL_MS = 5 * 60 * 1000;

async function buildTopProfiles(db) {
  const aggregates = await db.collection('profileRankingStats').orderBy('views', 'desc').limit(100).get();
  const ranked = rankTopProfiles(aggregates.docs.map((entry) => ({
    username: entry.id,
    views: Number(entry.data()?.views) || 0,
  })));
  if (!ranked.length) throw new Error('Profile ranking aggregates are not initialized.');
  const references = [
    ...ranked.map((row) => db.collection('profiles').doc(row.username)),
    ...ranked.map((row) => db.collection('directoryProfiles').doc(row.username)),
  ];
  const documents = await db.getAll(...references);
  const profileDocuments = documents.slice(0, ranked.length);
  const directoryDocuments = documents.slice(ranked.length);
  return ranked.map((row, index) => compactProfile(
    row.username,
    row.views,
    profileDocuments[index]?.data(),
    directoryDocuments[index]?.data() || {},
  )).filter(Boolean);
}

const snapshotRows = (data) => Array.isArray(data?.rows) ? data.rows : null;
const snapshotFresh = (data, time) => snapshotRows(data) && Number(data.refreshedAtMs) > time - SNAPSHOT_TTL_MS;

// Firestore keeps the ranking shared between serverless instances. The lease prevents
// concurrent cold starts from repeating one count query for every profile.
export async function loadTopProfiles(db, time = Date.now()) {
  const ref = db.collection('siteCache').doc('topProfiles');
  const snapshot = await ref.get();
  const previous = snapshot.data();
  if (snapshotFresh(previous, time)) return previous.rows;

  const decision = await db.runTransaction(async (transaction) => {
    const current = (await transaction.get(ref)).data();
    if (snapshotFresh(current, time)) return { rows: current.rows, refresh: false };
    if (Number(current?.leaseUntilMs) > time) return { rows: snapshotRows(current), refresh: false };
    transaction.set(ref, { leaseUntilMs: time + REFRESH_LEASE_MS }, { merge: true });
    return { rows: snapshotRows(current), refresh: true };
  });
  if (!decision.refresh) {
    if (decision.rows) return decision.rows;
    // Only the first ever request can reach this path; another instance owns the
    // initial refresh. Wait once rather than launching a duplicate collection scan.
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const ready = snapshotRows((await ref.get()).data());
    if (ready) return ready;
    throw new Error('Top profiles are being prepared.');
  }

  try {
    const rows = await buildTopProfiles(db);
    await ref.set({ rows, refreshedAtMs: time, leaseUntilMs: 0 });
    return rows;
  } catch (error) {
    // Serve the last complete snapshot if a refresh fails. The short lease expires
    // so a later request can retry without losing the leaderboard.
    if (decision.rows) return decision.rows;
    throw error;
  }
}

let cache = null;
let pending = null;

export async function topProfiles() {
  if (cache && cache.until > Date.now()) return cache.rows;
  if (pending) return pending;
  pending = (async () => {
    const rows = await loadTopProfiles(database());
    cache = { rows, until: Date.now() + LOCAL_TTL_MS };
    return rows;
  })();
  try { return await pending; }
  finally { pending = null; }
}
