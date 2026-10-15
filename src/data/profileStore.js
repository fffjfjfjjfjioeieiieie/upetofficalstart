import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '../app/firebase.js';
import { createDefaultProfile, domeProfilePreset } from '../shared/profileDefaults.js';
import { migrateProfile, toRendererProfile, validateProfileForSave } from '../shared/profileSchema.js';
export { uploadProfileAsset } from './mediaStore.js';

const publicRef = (username) => doc(firestore, 'profiles', username);
const draftRef = (uid) => doc(firestore, 'profileDrafts', uid);
const revisionsRef = (username) => collection(firestore, 'profileRevisions', username, 'revisions');

function legacyPublicData(data, username) {
  if (data.published) return toRendererProfile(data.published, { uid: data.ownerUid || data.uid, username });
  if (data.status === 'draft') return null;
  const source = username === 'dome' ? { ...domeProfilePreset, ...data } : data;
  return toRendererProfile(migrateProfile(source), { uid: data.ownerUid || data.uid, username });
}

export async function getPublicProfile(username) {
  if (!firestore) return username === 'dome' ? domeProfilePreset : null;
  try {
    const snapshot = await getDoc(publicRef(username));
    if (!snapshot.exists()) return username === 'dome' ? domeProfilePreset : null;
    const profile = legacyPublicData(snapshot.data(), username);
    return profile || (username === 'dome' ? domeProfilePreset : null);
  } catch (error) {
    if (username === 'dome') return domeProfilePreset;
    throw error;
  }
}

export async function getEditableProfile(user, username) {
  if (!user?.uid || !username) return null;
  const fallback = username === 'dome' ? domeProfilePreset : createDefaultProfile({ uid: user.uid, username });
  if (!firestore) return fallback;
  const [draftSnapshot, publicSnapshot] = await Promise.all([getDoc(draftRef(user.uid)), getDoc(publicRef(username))]);
  const publicData = publicSnapshot.exists() ? publicSnapshot.data() : null;
  if (publicData && (publicData.ownerUid || publicData.uid) !== user.uid) throw new Error('This profile belongs to another account.');
  if (draftSnapshot.exists() && draftSnapshot.data().username === username) return toRendererProfile(draftSnapshot.data().document, { uid: user.uid, username });
  if (publicData?.draft) return toRendererProfile(publicData.draft, { uid: user.uid, username });
  if (publicData?.published) return toRendererProfile(publicData.published, { uid: user.uid, username });
  if (publicData) return toRendererProfile(migrateProfile(username === 'dome' ? { ...domeProfilePreset, ...publicData } : publicData), { uid: user.uid, username });
  return fallback;
}

export async function getProfileStatus(user, username) {
  if (!firestore || !user?.uid || !username) return { publishedAt: null, draftUpdatedAt: null, published: false };
  const [draftSnapshot, publicSnapshot] = await Promise.all([getDoc(draftRef(user.uid)), getDoc(publicRef(username))]);
  return {
    draftUpdatedAt: draftSnapshot.data()?.updatedAt || null,
    publishedAt: publicSnapshot.data()?.publishedAt || null,
    published: Boolean(publicSnapshot.data()?.published || (publicSnapshot.exists() && publicSnapshot.data()?.status !== 'draft')),
  };
}

export async function saveProfile(user, username, profile) {
  if (!firestore || !user?.uid || !username) throw new Error('Profile saving is not configured.');
  const document = validateProfileForSave(profile);
  await setDoc(draftRef(user.uid), { schemaVersion: 1, ownerUid: user.uid, username, document, updatedAt: serverTimestamp() }, { merge: true });
  return toRendererProfile(document, { uid: user.uid, username });
}

export async function resetProfileDraft(user) {
  if (!firestore || !user?.uid) throw new Error('Draft reset is not configured.');
  await deleteDoc(draftRef(user.uid));
}

export async function getProfileRevisions(user, username) {
  if (!firestore || !user?.uid || !username) return [];
  const snapshot = await getDocs(query(revisionsRef(username), orderBy('publishedAt', 'desc'), limit(20)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export async function publishProfile(user, username, profile) {
  if (!firestore || !user?.uid || !username) throw new Error('Profile publishing is not configured.');
  const document = validateProfileForSave(profile);
  const result = await runTransaction(firestore, async (transaction) => {
    const [accountSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(doc(firestore, 'users', user.uid)), transaction.get(publicRef(username)),
    ]);
    if (!accountSnapshot.exists() || accountSnapshot.data().username !== username) throw new Error('Claim this username before publishing.');
    if (profileSnapshot.exists() && (profileSnapshot.data().ownerUid || profileSnapshot.data().uid) !== user.uid) throw new Error('This profile belongs to another account.');
    transaction.set(publicRef(username), {
      schemaVersion: 1, ownerUid: user.uid, username, status: 'published', published: document,
      publishedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      createdAt: profileSnapshot.exists() ? profileSnapshot.data().createdAt || serverTimestamp() : serverTimestamp(),
    });
    transaction.set(draftRef(user.uid), { schemaVersion: 1, ownerUid: user.uid, username, document, updatedAt: serverTimestamp() }, { merge: true });
    transaction.set(doc(revisionsRef(username)), { schemaVersion: 1, ownerUid: user.uid, username, document, publishedAt: serverTimestamp() });
    return document;
  });
  return toRendererProfile(result, { uid: user.uid, username });
}
