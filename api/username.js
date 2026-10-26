import { FieldValue } from 'firebase-admin/firestore';
import { bearerToken, verifyFirebaseIdentity } from '../server/firebaseAuth.js';
import { isFounderIdentity } from '../server/modviewPolicy.js';
import { database } from '../server/visitorStore.js';
import { renameProfileDocument, usernameChangeStatus, validateUsernameChange } from '../server/usernamePolicy.js';

const fail = (response, status, error, extra = {}) => response.status(status).json({ error, ...extra });

async function requireMember(db, identity) {
  if (isFounderIdentity(identity)) return;
  const invite = identity.email ? await db.collection('accessInvites').doc(identity.email).get() : null;
  if (!invite?.exists || invite.data()?.active !== true || invite.data()?.role !== 'member') throw new Error('Active Upet member access is required.');
}

const moved = (snapshot, username, extra = {}) => snapshot.exists
  ? { ...snapshot.data(), ...extra, username, updatedAt: FieldValue.serverTimestamp() }
  : null;

async function moveSubcollection(db, source, destination, username) {
  let cursor = null;
  do {
    let query = source.orderBy('__name__').limit(350);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach((entry) => {
      const data = entry.data();
      batch.set(destination.doc(entry.id), 'username' in data ? { ...data, username } : data);
      batch.delete(entry.ref);
    });
    await batch.commit();
    cursor = snapshot.docs.at(-1);
    if (snapshot.size < 350) break;
  } while (cursor);
}

async function replaceUsernameField(db, collectionName, field, oldUsername, newUsername) {
  const snapshot = await db.collection(collectionName).where(field, '==', oldUsername).limit(350).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach((entry) => batch.update(entry.ref, { [field]: newUsername, updatedAt: FieldValue.serverTimestamp() }));
  await batch.commit();
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(request.method)) return fail(response, 405, 'Method not allowed.');
  let identity;
  try { identity = await verifyFirebaseIdentity(bearerToken(request)); }
  catch { return fail(response, 401, 'Sign in to manage your username.'); }

  try {
    const db = database();
    await requireMember(db, identity);
    const accountRef = db.collection('users').doc(identity.uid);
    const accountSnapshot = await accountRef.get();
    if (!accountSnapshot.exists || !accountSnapshot.data()?.username) return fail(response, 400, 'Claim a username first.');
    const account = accountSnapshot.data();
    const status = usernameChangeStatus(account.usernameChangedAt);
    if (request.method === 'GET') return response.status(200).json({ username: account.username, ...status });
    if (!status.allowed) {
      const retryAfter = Math.max(1, Math.ceil((status.nextChangeAt - Date.now()) / 1000));
      response.setHeader('Retry-After', String(retryAfter));
      return fail(response, 429, 'Username changes are available again after the cooldown.', { nextChangeAt: status.nextChangeAt });
    }

    const body = typeof request.body === 'object' && request.body ? request.body : JSON.parse(request.body || '{}');
    const oldUsername = String(account.username).toLowerCase();
    const newUsername = validateUsernameChange(body.username, {
      currentUsername: oldUsername,
      email: identity.email,
      lastChangedAt: account.usernameChangedAt,
    });
    const refs = (username) => ({
      claim: db.collection('usernames').doc(username),
      profile: db.collection('profiles').doc(username),
      directory: db.collection('directoryProfiles').doc(username),
      grants: db.collection('profileBadgeGrants').doc(username),
      moderation: db.collection('moderationProfiles').doc(username),
      moderationCase: db.collection('moderationCases').doc(username),
      shop: db.collection('businessShops').doc(username),
      verifiedBusiness: db.collection('verifiedBusinesses').doc(username),
    });
    const oldRefs = refs(oldUsername);
    const nextRefs = refs(newUsername);
    const draftRef = db.collection('profileDrafts').doc(identity.uid);
    const presetStateRef = db.collection('profilePresetStates').doc(identity.uid);

    await db.runTransaction(async (transaction) => {
      const [freshAccount, nextClaim, nextProfile, oldClaim, oldProfile, oldDirectory, oldGrants, draft, presetState, oldModeration, oldCase, oldShop, oldVerified] = await Promise.all([
        transaction.get(accountRef), transaction.get(nextRefs.claim), transaction.get(nextRefs.profile),
        transaction.get(oldRefs.claim), transaction.get(oldRefs.profile), transaction.get(oldRefs.directory), transaction.get(oldRefs.grants),
        transaction.get(draftRef), transaction.get(presetStateRef), transaction.get(oldRefs.moderation), transaction.get(oldRefs.moderationCase),
        transaction.get(oldRefs.shop), transaction.get(oldRefs.verifiedBusiness),
      ]);
      const fresh = freshAccount.data();
      if (!freshAccount.exists || fresh?.username !== oldUsername) throw new Error('Your username changed in another session. Refresh and try again.');
      validateUsernameChange(newUsername, { currentUsername: oldUsername, email: identity.email, lastChangedAt: fresh.usernameChangedAt });
      if ((nextClaim.exists && nextClaim.data()?.uid !== identity.uid) || (nextProfile.exists && nextProfile.data()?.ownerUid !== identity.uid)) throw new Error(`user.pet/${newUsername} has already been claimed.`);
      if (!oldProfile.exists || oldProfile.data()?.ownerUid !== identity.uid) throw new Error('Your public profile could not be found.');

      const now = FieldValue.serverTimestamp();
      transaction.set(nextRefs.claim, { uid: identity.uid, username: newUsername, createdAt: now });
      transaction.update(accountRef, { username: newUsername, usernameChangedAt: now, updatedAt: now });
      const profile = oldProfile.data();
      transaction.set(nextRefs.profile, {
        ...profile,
        username: newUsername,
        published: renameProfileDocument(profile.published, newUsername),
        updatedAt: now,
      });
      transaction.delete(oldRefs.profile);
      if (oldDirectory.exists) transaction.set(nextRefs.directory, moved(oldDirectory, newUsername));
      transaction.delete(oldRefs.directory);
      if (oldGrants.exists) transaction.set(nextRefs.grants, moved(oldGrants, newUsername));
      transaction.delete(oldRefs.grants);
      if (draft.exists) transaction.set(draftRef, { ...draft.data(), username: newUsername, document: renameProfileDocument(draft.data()?.document, newUsername), updatedAt: now });
      if (presetState.exists) transaction.set(presetStateRef, { ...presetState.data(), username: newUsername, updatedAt: now });
      for (const [oldRef, nextRef, snapshot] of [
        [oldRefs.moderation, nextRefs.moderation, oldModeration], [oldRefs.moderationCase, nextRefs.moderationCase, oldCase],
        [oldRefs.shop, nextRefs.shop, oldShop], [oldRefs.verifiedBusiness, nextRefs.verifiedBusiness, oldVerified],
      ]) {
        if (snapshot.exists) transaction.set(nextRef, moved(snapshot, newUsername, snapshot.data()?.ownerUsername ? { ownerUsername: newUsername } : {}));
        transaction.delete(oldRef);
      }
      if (oldClaim.exists) transaction.delete(oldRefs.claim);
    });

    const presets = await db.collection('profilePresets').doc(identity.uid).collection('items').limit(5).get();
    if (!presets.empty) {
      const batch = db.batch();
      presets.docs.forEach((entry) => batch.update(entry.ref, { username: newUsername, document: renameProfileDocument(entry.data()?.document, newUsername), updatedAt: FieldValue.serverTimestamp() }));
      await batch.commit();
    }
    await Promise.all([
      moveSubcollection(db, db.collection('profileEvents').doc(oldUsername).collection('events'), db.collection('profileEvents').doc(newUsername).collection('events'), newUsername),
      moveSubcollection(db, db.collection('profileRevisions').doc(oldUsername).collection('revisions'), db.collection('profileRevisions').doc(newUsername).collection('revisions'), newUsername),
      replaceUsernameField(db, 'shopMessages', 'ownerUsername', oldUsername, newUsername),
      replaceUsernameField(db, 'shopConversations', 'ownerUsername', oldUsername, newUsername),
      replaceUsernameField(db, 'shopConversations', 'guestUsername', oldUsername, newUsername),
    ]);
    return response.status(200).json({ ok: true, username: newUsername, nextChangeAt: Date.now() + 2 * 60 * 60 * 1000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Username could not be changed.';
    const cooldown = message.match(/^You can change your username again in (\d+) minute/);
    if (cooldown) {
      response.setHeader('Retry-After', String(Number(cooldown[1]) * 60));
      return fail(response, 429, message);
    }
    return fail(response, /already been claimed|unavailable/.test(message) ? 409 : 400, message);
  }
}
