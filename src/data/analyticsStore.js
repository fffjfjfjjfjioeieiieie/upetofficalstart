import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '../app/firebase.js';

const eventCollection = (username) => collection(firestore, 'profileEvents', username, 'events');
const today = () => new Date().toISOString().slice(0, 10);

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
  const day = today();
  const key = `${username}:${kind}:${linkId}:${day}:${sessionId()}`;
  const id = await eventId(key);
  try {
    await setDoc(doc(eventCollection(username), id), {
      kind, linkId: String(linkId).slice(0, 80), day,
      device: deviceType(), referrer: referringSite(), createdAt: serverTimestamp(),
    });
    return true;
  } catch { return false; }
}

export async function getProfileAnalytics(username) {
  if (!firestore || !username) return null;
  const snapshot = await getDocs(query(eventCollection(username), orderBy('createdAt', 'desc'), limit(500)));
  const rows = snapshot.docs.map((entry) => entry.data());
  const views = rows.filter((row) => row.kind === 'view').length;
  const clicks = rows.filter((row) => row.kind === 'click').length;
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
  return { views, clicks, clickRate: views ? Math.round(clicks / views * 100) : 0, byLink, byDevice, byDay, byReferrer, sampleLimit: 500 };
}
