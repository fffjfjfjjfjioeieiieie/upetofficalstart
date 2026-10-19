import { database } from '../server/visitorStore.js';
import { bearerToken, verifyFirebaseToken } from '../server/firebaseAuth.js';

const fail = (res, status, error) => res.status(status).json({ error });
const validId = (value) => /^[a-z0-9][a-z0-9._-]{2,19}$/.test(String(value || ''));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['POST', 'DELETE'].includes(req.method)) return fail(res, 405, 'Method not allowed.');
  let actor;
  try { actor = await verifyFirebaseToken(bearerToken(req)); }
  catch { return fail(res, 401, 'Sign in with your personal account.'); }
  try {
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const id = String(body.businessId || '');
    if (!validId(id)) return fail(res, 400, 'Invalid business.');
    const db = database();
    const ref = db.collection('businesses').doc(id);
    const business = await ref.get();
    if (!business.exists || business.data().ownerUid !== actor.uid) return fail(res, 403, 'Only the business owner can manage the team.');

    if (req.method === 'DELETE') {
      const uid = String(body.uid || '');
      if (!uid || uid === actor.uid) return fail(res, 400, 'The owner cannot be removed.');
      await db.runTransaction(async (tx) => {
        const current = await tx.get(ref);
        if (!current.exists || current.data().ownerUid !== actor.uid) throw new Error('Business access changed.');
        const members = { ...current.data().members };
        delete members[uid];
        tx.update(ref, { members, memberUids: Object.keys(members), updatedAt: new Date() });
      });
      return res.status(200).json({ ok: true });
    }

    const role = String(body.role || '');
    if (!['manager', 'editor', 'viewer'].includes(role)) return fail(res, 400, 'Choose a valid employee role.');
    const username = String(body.username || '').trim().toLowerCase();
    const email = String(body.email || '').trim().toLowerCase();
    if (!username && !email) return fail(res, 400, 'Enter an email or profile username.');
    let personal;
    let memberUid;
    if (username) {
      if (!validId(username)) return fail(res, 400, 'Invalid profile username.');
      const profile = await db.collection('profiles').doc(username).get();
      if (!profile.exists || !profile.data().ownerUid) return fail(res, 404, 'That personal profile was not found.');
      memberUid = profile.data().ownerUid;
      personal = await db.collection('users').doc(memberUid).get();
    } else {
      const matches = await db.collection('users').where('email', '==', email).limit(1).get();
      personal = matches.docs[0];
      memberUid = personal?.id;
    }
    if (!personal?.exists || !personal.data().username) return fail(res, 400, 'This person must claim a personal profile first.');
    if (email && personal.data().email !== email) return fail(res, 400, 'The email and profile belong to different accounts.');
    if (memberUid === actor.uid) return fail(res, 400, 'The owner already has full access.');
    if (username && personal.data().username !== username) return fail(res, 400, 'That profile does not match the personal account.');

    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (!current.exists || current.data().ownerUid !== actor.uid) throw new Error('Business access changed.');
      const members = { ...current.data().members };
      if (!members[memberUid] && Object.keys(members).length >= 20) throw new Error('A business can have up to 20 team members.');
      members[memberUid] = { email: personal.data().email, username: personal.data().username, role };
      tx.update(ref, { members, memberUids: Object.keys(members), updatedAt: new Date() });
    });
    return res.status(200).json({ ok: true, member: { uid: memberUid, username: personal.data().username, email: personal.data().email, role } });
  } catch (error) {
    console.error('Business team update failed:', error);
    return fail(res, 400, error.message || 'Could not update the team.');
  }
}
