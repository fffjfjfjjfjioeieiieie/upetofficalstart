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

export function rankTopProfiles(rows) {
  return rows.filter((row) => usernamePattern.test(row.username) && Number.isFinite(row.views) && row.views >= 0)
    .sort((a, b) => b.views - a.views || a.username.localeCompare(b.username))
    .slice(0, 3);
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
    badges: Array.isArray(profile.shownBadges) ? profile.shownBadges.map((badge) => text(badge, 32)).slice(0, 3) : [],
    linkCount: Array.isArray(profile.links) ? profile.links.length : 0,
    card: {
      accent: color(profile.card?.accent, '#6cc4ff'),
      bgColor: color(profile.card?.bgColor, '#07111f'),
      cardColor: color(profile.card?.cardColor, '#0b1626'),
    },
  };
}

let cache = null;
let pending = null;

export async function topProfiles() {
  if (cache && cache.until > Date.now()) return cache.rows;
  if (pending) return pending;
  pending = (async () => {
    const db = database();
    const directory = await db.collection('directoryProfiles').get();
    const candidates = directory.docs.filter((doc) => usernamePattern.test(doc.id));
    const counts = await Promise.all(candidates.map(async (doc) => {
      const count = await db.collection('profileEvents').doc(doc.id).collection('events').where('kind', '==', 'view').count().get();
      return { username: doc.id, views: count.data().count || 0, directory: doc.data() };
    }));
    const ranked = rankTopProfiles(counts);
    const documents = ranked.length ? await db.getAll(...ranked.map((row) => db.collection('profiles').doc(row.username))) : [];
    const rows = ranked.map((row, index) => compactProfile(row.username, row.views, documents[index]?.data(), row.directory)).filter(Boolean);
    cache = { rows, until: Date.now() + 300000 };
    return rows;
  })();
  try { return await pending; }
  finally { pending = null; }
}
