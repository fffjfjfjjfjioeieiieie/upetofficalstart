import { FieldValue } from 'firebase-admin/firestore';
import { database } from '../server/visitorStore.js';
import { bearerToken, verifyFirebaseIdentity } from '../server/firebaseAuth.js';
import { isFounderIdentity } from '../server/modviewPolicy.js';
import { cleanPresetName, MAX_PROFILE_PRESETS, presetPreview } from '../server/profilePresetPolicy.js';
import { applyProfileGrants } from '../src/redesign/lib/profileGrants.js';

const fail = (res, status, error) => res.status(status).json({ error });

async function memberAccount(db, identity) {
  if (!isFounderIdentity(identity)) {
    const invite = identity.email ? await db.collection('accessInvites').doc(identity.email).get() : null;
    if (!invite?.exists || invite.data()?.active !== true || invite.data()?.role !== 'member') throw new Error('Active Upet member access is required.');
  }
  const account = await db.collection('users').doc(identity.uid).get();
  if (!account.exists || !account.data()?.username) throw new Error('Claim a username before using profile presets.');
  return account.data();
}

const collectionFor = (db, uid) => db.collection('profilePresets').doc(uid).collection('items');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return fail(res, 405, 'Method not allowed.');
  let identity;
  try { identity = await verifyFirebaseIdentity(bearerToken(req)); }
  catch { return fail(res, 401, 'Sign in to manage profile presets.'); }

  try {
    const db = database();
    const account = await memberAccount(db, identity);
    const username = account.username;
    const presets = collectionFor(db, identity.uid);
    const stateRef = db.collection('profilePresetStates').doc(identity.uid);

    if (req.method === 'GET') {
      const [snapshot, state] = await Promise.all([presets.orderBy('updatedAt', 'desc').limit(MAX_PROFILE_PRESETS).get(), stateRef.get()]);
      const activePresetId = state.data()?.activePresetId || '';
      return res.status(200).json({
        max: MAX_PROFILE_PRESETS,
        activePresetId,
        items: snapshot.docs.map((entry) => {
          const data = entry.data();
          return { id: entry.id, name: data.name, preview: presetPreview(data.document, username), createdAt: data.createdAt, updatedAt: data.updatedAt };
        }),
      });
    }

    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const action = String(body.action || '');
    const presetId = String(body.id || '').trim();

    if (action === 'clearActive') {
      await stateRef.set({ ownerUid: identity.uid, username, activePresetId: '', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return res.status(200).json({ ok: true });
    }

    if (action === 'create') {
      const name = cleanPresetName(body.name);
      const presetRef = presets.doc();
      await db.runTransaction(async (tx) => {
        const [state, profile] = await Promise.all([tx.get(stateRef), tx.get(db.collection('profiles').doc(username))]);
        const count = Number(state.data()?.count || 0);
        if (count >= MAX_PROFILE_PRESETS) throw new Error(`You can save up to ${MAX_PROFILE_PRESETS} profile presets.`);
        if (!profile.exists || profile.data()?.ownerUid !== identity.uid || !profile.data()?.published) throw new Error('Your live profile is not ready to save yet.');
        const now = FieldValue.serverTimestamp();
        tx.create(presetRef, { ownerUid: identity.uid, username, name, document: profile.data().published, createdAt: now, updatedAt: now });
        tx.set(stateRef, { ownerUid: identity.uid, username, activePresetId: presetRef.id, count: count + 1, updatedAt: now }, { merge: true });
      });
      return res.status(201).json({ ok: true, id: presetRef.id });
    }

    if (!presetId) return fail(res, 400, 'Choose a profile preset first.');
    const presetRef = presets.doc(presetId);

    if (action === 'update') {
      await db.runTransaction(async (tx) => {
        const [preset, profile] = await Promise.all([tx.get(presetRef), tx.get(db.collection('profiles').doc(username))]);
        if (!preset.exists || preset.data()?.ownerUid !== identity.uid) throw new Error('Profile preset not found.');
        if (!profile.exists || profile.data()?.ownerUid !== identity.uid || !profile.data()?.published) throw new Error('Your live profile is not ready to save yet.');
        tx.update(presetRef, { document: profile.data().published, updatedAt: FieldValue.serverTimestamp() });
      });
      return res.status(200).json({ ok: true });
    }

    if (action === 'rename') {
      const name = cleanPresetName(body.name);
      const preset = await presetRef.get();
      if (!preset.exists || preset.data()?.ownerUid !== identity.uid) return fail(res, 404, 'Profile preset not found.');
      await presetRef.update({ name, updatedAt: FieldValue.serverTimestamp() });
      return res.status(200).json({ ok: true });
    }

    if (action === 'activate') {
      await db.runTransaction(async (tx) => {
        const [preset, profile, state, grants] = await Promise.all([
          tx.get(presetRef),
          tx.get(db.collection('profiles').doc(username)),
          tx.get(stateRef),
          tx.get(db.collection('profileBadgeGrants').doc(username)),
        ]);
        if (!preset.exists || preset.data()?.ownerUid !== identity.uid) throw new Error('Profile preset not found.');
        if (!profile.exists || profile.data()?.ownerUid !== identity.uid) throw new Error('Your live profile could not be found.');
        const document = preset.data().document;
        if (!document?.redesign) throw new Error('This profile preset is damaged.');
        const now = FieldValue.serverTimestamp();
        tx.set(db.collection('profileDrafts').doc(identity.uid), { schemaVersion: 1, ownerUid: identity.uid, username, document, updatedAt: now }, { merge: true });
        tx.set(db.collection('profiles').doc(username), { schemaVersion: 1, ownerUid: identity.uid, username, status: 'published', published: document, publishedAt: now, updatedAt: now, createdAt: profile.data().createdAt || now });
        tx.set(db.collection('directoryProfiles').doc(username), { ownerUid: identity.uid, username, displayName: document.redesign.displayName, alias: document.redesign.alias, avatar: document.redesign.media?.avatar || {}, badges: applyProfileGrants(document.redesign, grants.data()?.badges).shownBadges, shop: document.redesign.shop || {}, updatedAt: now });
        tx.set(stateRef, { ownerUid: identity.uid, username, activePresetId: presetId, count: Number(state.data()?.count || 1), updatedAt: now }, { merge: true });
      });
      return res.status(200).json({ ok: true });
    }

    if (action === 'delete') {
      await db.runTransaction(async (tx) => {
        const [preset, state] = await Promise.all([tx.get(presetRef), tx.get(stateRef)]);
        if (!preset.exists || preset.data()?.ownerUid !== identity.uid) throw new Error('Profile preset not found.');
        const count = Math.max(0, Number(state.data()?.count || 1) - 1);
        tx.delete(presetRef);
        tx.set(stateRef, { ownerUid: identity.uid, username, activePresetId: state.data()?.activePresetId === presetId ? '' : state.data()?.activePresetId || '', count, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      });
      return res.status(200).json({ ok: true });
    }

    return fail(res, 400, 'Unknown profile preset action.');
  } catch (error) {
    console.error('Profile preset request failed:', error);
    return fail(res, 400, error?.message || 'Profile preset request failed.');
  }
}
