import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { firestore } from '../../app/firebase.js';
import { domeProfilePreset } from '../../shared/profileDefaults.js';
import { redesignFromDocument, documentFromRedesign, sanitizeRedesignProfile } from './profileModel.js';
import { applyProfileGrants } from './profileGrants.js';

const profileRef = (username) => doc(firestore, 'profiles', username);
const draftRef = (uid) => doc(firestore, 'profileDrafts', uid);
const directoryRef = (username) => doc(firestore, 'directoryProfiles', username);

const publicProfileFromSnapshot = (snapshot, username, grants = []) => {
  if (!snapshot?.exists()) return username === 'dome' ? applyProfileGrants(redesignFromDocument(domeProfilePreset, username), grants) : null;
  const data = snapshot.data();
  if (data.status === 'draft' && !data.published) return username === 'dome' ? applyProfileGrants(redesignFromDocument(domeProfilePreset, username), grants) : null;
  return applyProfileGrants(redesignFromDocument(data.published || data, username), grants);
};

function assertReady(user, username) {
  if (!firestore) throw new Error('Firebase is not configured.');
  if (!user?.uid || !username) throw new Error('Sign in and claim a username first.');
}

export async function getEditableRedesign(user, username) {
  assertReady(user, username);
  const [draftSnapshot, publicSnapshot, grantsSnapshot] = await Promise.all([
    getDoc(draftRef(user.uid)),
    getDoc(profileRef(username)),
    getDoc(doc(firestore, 'profileBadgeGrants', username)),
  ]);
  const publicData = publicSnapshot.exists() ? publicSnapshot.data() : null;
  if (publicData && (publicData.ownerUid || publicData.uid) !== user.uid) throw new Error('This profile belongs to another account.');
  const draftData = draftSnapshot.data();
  const document = draftData?.username === username
    ? draftData.document
    : publicData?.published || publicData?.draft || publicData;
  return applyProfileGrants(redesignFromDocument(document, username), grantsSnapshot.data()?.badges);
}

export async function getPublicRedesign(username) {
  if (!username) return null;
  if (!firestore) return username === 'dome' ? redesignFromDocument(domeProfilePreset, username) : null;
  try {
    const [snapshot, grantsSnapshot] = await Promise.all([getDoc(profileRef(username)), getDoc(doc(firestore, 'profileBadgeGrants', username))]);
    if (!snapshot.exists()) return username === 'dome' ? redesignFromDocument(domeProfilePreset, username) : null;
    const data = snapshot.data();
    if (data.status === 'draft' && !data.published) return username === 'dome' ? redesignFromDocument(domeProfilePreset, username) : null;
    return applyProfileGrants(redesignFromDocument(data.published || data, username), grantsSnapshot.data()?.badges);
  } catch (error) {
    if (username === 'dome') return redesignFromDocument(domeProfilePreset, username);
    throw error;
  }
}

export function subscribePublicRedesign(username, onChange, onError = () => {}) {
  if (!username || !firestore) {
    onChange(username === 'dome' ? redesignFromDocument(domeProfilePreset, username) : null);
    return () => {};
  }
  let profileSnapshot;
  let grants = [];
  let profileReady = false;
  let grantsReady = false;
  const emit = () => {
    if (profileReady && grantsReady) onChange(publicProfileFromSnapshot(profileSnapshot, username, grants));
  };
  const stopProfile = onSnapshot(profileRef(username), (snapshot) => {
    profileSnapshot = snapshot;
    profileReady = true;
    emit();
  }, onError);
  const stopGrants = onSnapshot(doc(firestore, 'profileBadgeGrants', username), (snapshot) => {
    grants = snapshot.data()?.badges || [];
    grantsReady = true;
    emit();
  }, onError);
  return () => { stopProfile(); stopGrants(); };
}

export function subscribeEditableRedesign(user, username, onChange, onError = () => {}) {
  assertReady(user, username);
  let draftSnapshot;
  let publicSnapshot;
  let grants = [];
  let draftReady = false;
  let publicReady = false;
  let grantsReady = false;
  const emit = () => {
    if (!draftReady || !publicReady || !grantsReady) return;
    const publicData = publicSnapshot.exists() ? publicSnapshot.data() : null;
    if (publicData && (publicData.ownerUid || publicData.uid) !== user.uid) {
      onError(new Error('This profile belongs to another account.'));
      return;
    }
    const draftData = draftSnapshot.data();
    const document = draftData?.username === username
      ? draftData.document
      : publicData?.published || publicData?.draft || publicData;
    onChange(applyProfileGrants(redesignFromDocument(document, username), grants));
  };
  const stopDraft = onSnapshot(draftRef(user.uid), (snapshot) => {
    draftSnapshot = snapshot;
    draftReady = true;
    emit();
  }, onError);
  const stopPublic = onSnapshot(profileRef(username), (snapshot) => {
    publicSnapshot = snapshot;
    publicReady = true;
    emit();
  }, onError);
  const stopGrants = onSnapshot(doc(firestore, 'profileBadgeGrants', username), (snapshot) => {
    grants = snapshot.data()?.badges || [];
    grantsReady = true;
    emit();
  }, onError);
  return () => { stopDraft(); stopPublic(); stopGrants(); };
}

export async function saveRedesignProfile(user, username, profile, { publish = true } = {}) {
  assertReady(user, username);
  const document = documentFromRedesign(profile, user.uid, username);
  if (!publish) {
    await setDoc(draftRef(user.uid), {
      schemaVersion: 1,
      ownerUid: user.uid,
      username,
      document,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return document.redesign;
  }

  await runTransaction(firestore, async (transaction) => {
    const account = await transaction.get(doc(firestore, 'users', user.uid));
    const currentProfile = await transaction.get(profileRef(username));
    const grantsSnapshot = await transaction.get(doc(firestore, 'profileBadgeGrants', username));
    if (!account.exists() || account.data().username !== username) throw new Error('Claim this username before publishing.');
    if (currentProfile.exists() && (currentProfile.data().ownerUid || currentProfile.data().uid) !== user.uid) throw new Error('This profile belongs to another account.');
    const now = serverTimestamp();
    transaction.set(draftRef(user.uid), {
      schemaVersion: 1,
      ownerUid: user.uid,
      username,
      document,
      updatedAt: now,
    }, { merge: true });
    transaction.set(profileRef(username), {
      schemaVersion: 1,
      ownerUid: user.uid,
      username,
      status: 'published',
      published: document,
      publishedAt: now,
      updatedAt: now,
      createdAt: currentProfile.exists() ? currentProfile.data().createdAt || now : now,
    });
    transaction.set(directoryRef(username), {
      ownerUid: user.uid,
      username,
      displayName: document.redesign.displayName,
      alias: document.redesign.alias,
      avatar: document.redesign.media.avatar,
      badges: applyProfileGrants(document.redesign, grantsSnapshot.data()?.badges).shownBadges,
      shop: document.redesign.shop,
      updatedAt: now,
    });
  });
  return document.redesign;
}

export async function listDirectoryProfiles() {
  if (!firestore) return [];
  const snapshot = await getDocs(query(collection(firestore, 'directoryProfiles'), orderBy('updatedAt', 'desc'), limit(60)));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    const profile = sanitizeRedesignProfile({
      username: data.username || entry.id,
      displayName: data.displayName,
      alias: data.alias,
      media: { avatar: data.avatar },
      badges: data.badges,
      shownBadges: data.badges,
      shop: data.shop,
    }, data.username || entry.id);
    const shownBadges = Array.isArray(data.badges) ? [...new Set(data.badges)] : [];
    return {
      username: profile.username,
      role: 'user',
      banned: false,
      profile: { ...profile, badges: shownBadges, shownBadges },
    };
  });
}
