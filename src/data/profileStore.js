import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '../app/firebase.js';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../app/firebase.js';
import { createDefaultProfile, domeProfilePreset } from '../shared/profileDefaults.js';

export async function getPublicProfile(username) {
  if (username === 'dome') {
    if (!firestore) return domeProfilePreset;
    try {
      const snapshot = await getDoc(doc(firestore, 'profiles', 'dome'));
      return snapshot.exists() ? { ...domeProfilePreset, ...snapshot.data() } : domeProfilePreset;
    } catch {
      return domeProfilePreset;
    }
  }
  if (!firestore) return null;
  const snapshot = await getDoc(doc(firestore, 'profiles', username));
  return snapshot.exists()
    ? { ...createDefaultProfile({ uid: snapshot.data().uid, username }), ...snapshot.data() }
    : null;
}

export async function getEditableProfile(user, username) {
  if (!user?.uid || !username) return null;
  const saved = await getPublicProfile(username);
  const fallback = username === 'dome'
    ? domeProfilePreset
    : createDefaultProfile({ uid: user.uid, username });
  return { ...fallback, ...(saved || {}), uid: user.uid, username };
}

export async function saveProfile(user, username, profile) {
  if (!firestore || !user?.uid || !username) throw new Error('Profile saving is not configured.');
  const cleanProfile = {
    ...createDefaultProfile({ uid: user.uid, username }),
    ...profile,
    uid: user.uid,
    username,
    updatedAt: serverTimestamp(),
  };
  delete cleanProfile.ownerEmail;
  delete cleanProfile.createdAt;
  await setDoc(doc(firestore, 'profiles', username), cleanProfile, { merge: true });
  return cleanProfile;
}

export function uploadProfileAsset(user, kind, file, onProgress) {
  if (!storage || !user?.uid) throw new Error('Media uploads are not configured yet.');
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const assetRef = ref(storage, `profiles/${user.uid}/${kind}-${Date.now()}-${safeName}`);
  const task = uploadBytesResumable(assetRef, file, { contentType: file.type });
  return new Promise((resolve, reject) => {
    task.on('state_changed', (snapshot) => {
      onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
    }, reject, async () => resolve(getDownloadURL(task.snapshot.ref)));
  });
}

