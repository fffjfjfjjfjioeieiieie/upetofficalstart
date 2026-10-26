import { collection, getCountFromServer, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { firestore } from '../app/firebase.js';
import { RATE_LIMITS } from '../shared/rateLimits.js';
import { boundedQueryLimit, firestorePage } from '../shared/data/queryPolicy.js';

const eventCollection = (username) => collection(firestore, 'profileEvents', username, 'events');
const today = () => new Date().toISOString().slice(0, 10);
const VIEW_WINDOW_MS = RATE_LIMITS.profileViewWindowMs;
const pendingEvents = new Set();

function sessionId() {
  try {
    const key = 'userpet-analytics-session';
    let value = sessionStorage.getItem(key);
    if (!value) { value = crypto.randomUUID(); sessionStorage.setItem(key, value); }
    return value;
  } catch { return crypto.randomUUID(); }
}

async function eventId(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function deviceType() {
  return matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
}

function referringSite() {
  try {
    const hostname = document.referrer ? new URL(document.referrer).hostname : '';
    return hostname && hostname !== location.hostname ? hostname.slice(0, 100) : 'direct';
  } catch { return 'direct'; }
}

export async function recordProfileEvent(username, kind, linkId = '') {
  if (!firestore || !username || !['view', 'click'].includes(kind)) return false;
  const windowStart = Math.floor(Date.now() / VIEW_WINDOW_MS);
  const visitKey = `upet-view:${username}`;
  if (kind === 'view') {
    try {
      const lastVisit = Number(localStorage.getItem(visitKey)) || 0;
      if (Date.now() - lastVisit < VIEW_WINDOW_MS) return false;
    } catch { /* Private browsing may disable local storage. */ }
  }
  const day = today();
  const key = `${username}:${kind}:${linkId}:${day}:${sessionId()}:${kind === 'view' ? windowStart : ''}`;
  if (pendingEvents.has(key)) return false;
  pendingEvents.add(key);
  const id = await eventId(key);
  try {
    const response = await fetch('/api/profile-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        kind,
        eventId: id,
        linkId: String(linkId).slice(0, 80),
        device: deviceType(),
        referrer: referringSite(),
      }),
    });
    if (!response.ok) return false;
    if (kind === 'view') {
      try { localStorage.setItem(visitKey, String(Date.now())); } catch { /* Ignore unavailable storage. */ }
    }
    return true;
  } catch { return false; }
  finally { pendingEvents.delete(key); }
}

export async function getProfileAnalytics(username) {
  if (!firestore || !username) return null;
  const events = eventCollection(username);
  const [snapshot, viewCount, clickCount] = await Promise.all([
    getDocs(query(events, orderBy('createdAt', 'desc'), limit(40))),
    getCountFromServer(query(events, where('kind', '==', 'view'))),
    getCountFromServer(query(events, where('kind', '==', 'click'))),
  ]);
  const rows = snapshot.docs.map((entry) => entry.data());
  const views = viewCount.data().count || 0;
  const clicks = clickCount.data().count || 0;
  const byLink = {};
  const byDevice = {};
  const byDay = {};
  const byReferrer = {};
  for (const row of rows) {
    if (row.kind === 'click') byLink[row.linkId] = (byLink[row.linkId] || 0) + 1;
    if (row.kind === 'view') {
      byDevice[row.device] = (byDevice[row.device] || 0) + 1;
      byDay[row.day] = (byDay[row.day] || 0) + 1;
      byReferrer[row.referrer || 'direct'] = (byReferrer[row.referrer || 'direct'] || 0) + 1;
    }
  }
  return { views, clicks, clickRate: views ? Math.round(clicks / views * 100) : 0, byLink, byDevice, byDay, byReferrer, sampleLimit: 40 };
}

export async function getProfileAnalyticsEventsPage(username, { cursor = null, pageSize } = {}) {
  if (!firestore || !username) return { items: [], cursor: null, hasMore: false };
  const size = boundedQueryLimit('analyticsEvents', pageSize);
  const constraints = [orderBy('createdAt', 'desc')];
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(size + 1));
  return firestorePage(await getDocs(query(eventCollection(username), ...constraints)), size);
}
