import { deleteObject, getDownloadURL, listAll, ref, uploadBytesResumable } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { storage } from '../app/firebase.js';

const limitsMb = { avatar: 5, banner: 10, cursor: 5, background: 100, audio: 20, click: 5, image: 10, video: 100, cover: 5 };
const accepted = { avatar: 'image/', banner: 'image/', cursor: 'image/', background: ['image/', 'video/'], audio: 'audio/', click: 'audio/', image: 'image/', video: 'video/', cover: 'image/' };

function accepts(kind, mime) {
  const rule = accepted[kind];
  return (Array.isArray(rule) ? rule : [rule]).some((prefix) => mime?.startsWith(prefix));
}

export async function uploadProfileAsset(user, kind, originalFile, onProgress) {
  if (!storage || !user?.uid) throw new Error('Firebase Storage is not ready for uploads.');
  if (!(kind in limitsMb) || !accepts(kind, originalFile?.type)) throw new Error(`Choose a supported ${kind} file.`);
  if (originalFile.size > limitsMb[kind] * 1024 * 1024) throw new Error(`${kind} files can be up to ${limitsMb[kind]} MB.`);
  const file = originalFile.type.startsWith('image/') && originalFile.type !== 'image/gif' && originalFile.size > 1024 * 1024
    ? await imageCompression(originalFile, { maxSizeMB: 1.5, maxWidthOrHeight: 2200, useWebWorker: true })
    : originalFile;
  const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const assetRef = ref(storage, `profiles/${user.uid}/${kind}-${id}.${extension}`);
  const task = uploadBytesResumable(assetRef, file, { contentType: file.type, customMetadata: { ownerUid: user.uid, kind } });
  return new Promise((resolve, reject) => task.on('state_changed',
    (snapshot) => onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
    reject,
    async () => resolve(getDownloadURL(task.snapshot.ref)),
  ));
}

export async function deleteProfileAsset(user, fullPath) {
  if (!storage || !user?.uid || !fullPath?.startsWith(`profiles/${user.uid}/`)) throw new Error('This asset does not belong to your profile.');
  await deleteObject(ref(storage, fullPath));
}

export async function listProfileAssets(user) {
  if (!storage || !user?.uid) return [];
  const result = await listAll(ref(storage, `profiles/${user.uid}`));
  return Promise.all(result.items.slice(-100).map(async (item) => ({
    name: item.name,
    kind: item.name.split('-')[0],
    fullPath: item.fullPath,
    url: await getDownloadURL(item),
  })));
}
