import { FieldValue } from 'firebase-admin/firestore';

const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,19}$/;
const eventIdPattern = /^[a-f0-9]{64}$/;

export function cleanProfileEvent(input = {}, at = new Date()) {
  const username = String(input.username || '').trim().toLowerCase();
  const kind = String(input.kind || '');
  const eventId = String(input.eventId || '').trim().toLowerCase();
  if (!usernamePattern.test(username)) throw new Error('Invalid username.');
  if (!['view', 'click'].includes(kind)) throw new Error('Invalid profile event.');
  if (!eventIdPattern.test(eventId)) throw new Error('Invalid event identifier.');
  return Object.freeze({
    username,
    kind,
    eventId,
    linkId: kind === 'click' ? String(input.linkId || '').slice(0, 80) : '',
    day: at.toISOString().slice(0, 10),
    device: input.device === 'mobile' ? 'mobile' : 'desktop',
    referrer: String(input.referrer || 'direct').slice(0, 100),
  });
}

export async function recordProfileEventAggregate(db, input, at = new Date()) {
  const event = cleanProfileEvent(input, at);
  const profileRef = db.collection('profiles').doc(event.username);
  const eventRef = db.collection('profileEvents').doc(event.username).collection('events').doc(event.eventId);
  const aggregateRef = db.collection('profileRankingStats').doc(event.username);
  return db.runTransaction(async (transaction) => {
    const [profile, existing] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(eventRef),
    ]);
    if (!profile.exists || (profile.data()?.status !== 'published' && !profile.data()?.published)) {
      throw new Error('Profile not found.');
    }
    if (existing.exists) return Object.freeze({ recorded: false, duplicate: true, event });
    transaction.create(eventRef, {
      kind: event.kind,
      linkId: event.linkId,
      day: event.day,
      device: event.device,
      referrer: event.referrer,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.set(aggregateRef, {
      username: event.username,
      views: FieldValue.increment(event.kind === 'view' ? 1 : 0),
      clicks: FieldValue.increment(event.kind === 'click' ? 1 : 0),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return Object.freeze({ recorded: true, duplicate: false, event });
  });
}
