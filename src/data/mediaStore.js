import { upload } from '@vercel/blob/client';
import imageCompression from 'browser-image-compression';

const limitsMb = { avatar: 5, banner: 10, cursor: 5, background: 100, audio: 20, click: 5, image: 10, video: 100, cover: 5 };
const accepted = { avatar: 'image/', banner: 'image/', cursor: 'image/', background: ['image/', 'video/'], audio: 'audio/', click: 'audio/', image: 'image/', video: 'video/', cover: 'image/' };

function accepts(kind, mime) {
  const rule = accepted[kind];
  return (Array.isArray(rule) ? rule : [rule]).some((prefix) => mime?.startsWith(prefix));
}

export async function uploadProfileAsset(user, kind, originalFile, onProgress) {
  if (!user?.uid || typeof user.getIdToken !== 'function') throw new Error('Sign in before uploading files.');
  if (!(kind in limitsMb) || !accepts(kind, originalFile?.type)) throw new Error(`Choose a supported ${kind} file.`);
  if (originalFile.size > limitsMb[kind] * 1024 * 1024) throw new Error(`${kind} files can be up to ${limitsMb[kind]} MB.`);
  const file = originalFile.type.startsWith('image/') && originalFile.type !== 'image/gif' && originalFile.size > 1024 * 1024
    ? await imageCompression(originalFile, { maxSizeMB: 1.5, maxWidthOrHeight: 2200, useWebWorker: true })
    : originalFile;
  const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const idToken = await user.getIdToken();
  const blob = await upload(`profiles/${user.uid}/${kind}-${id}.${extension}`, file, {
    access: 'public',
    handleUploadUrl: '/api/blob',
    clientPayload: JSON.stringify({ idToken, kind }),
    contentType: file.type,
    multipart: file.size > 4 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => onProgress?.(Math.round(percentage)),
  });
  return blob.url;
}

export async function deleteProfileAsset(user, url) {
  if (!user?.uid || typeof user.getIdToken !== 'function') throw new Error('Sign in before deleting files.');
  const response = await fetch('/api/blob', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The file could not be deleted.');
}

export async function listProfileAssets(user) {
  if (!user?.uid || typeof user.getIdToken !== 'function') return [];
  const response = await fetch('/api/blob', { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Your media library could not be loaded.');
  return (result.blobs || []).map((item) => {
    const name = item.pathname.split('/').pop() || item.pathname;
    return { name, kind: name.split('-')[0], fullPath: item.url, url: item.url, size: item.size, uploadedAt: item.uploadedAt };
  });
}
