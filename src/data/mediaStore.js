import { upload } from '@vercel/blob/client';
import imageCompression from 'browser-image-compression';
import { AUDIO_EXTENSION_MIME } from '../shared/mediaTypes.js';

const limitsMb = { avatar: 20, banner: 50, cursor: 5, background: 100, audio: 20, click: 5, image: 10, video: 100, cover: 5 };
const accepted = { avatar: ['image/', 'video/'], banner: ['image/', 'video/'], cursor: 'image/', background: ['image/', 'video/'], audio: ['audio/', 'video/mp4', 'video/webm'], click: ['audio/', 'video/mp4', 'video/webm'], image: 'image/', video: 'video/', cover: 'image/' };
const imagePresets = {
  avatar: { maxSizeMB: 0.55, maxWidthOrHeight: 768 },
  banner: { maxSizeMB: 0.85, maxWidthOrHeight: 1600 },
  background: { maxSizeMB: 4.5, maxWidthOrHeight: 3840, initialQuality: 0.92 },
  cursor: { maxSizeMB: 0.25, maxWidthOrHeight: 256 },
  cover: { maxSizeMB: 0.5, maxWidthOrHeight: 900 },
  image: { maxSizeMB: 0.8, maxWidthOrHeight: 1600 },
};

function usableFile(file, kind) {
  const extension = String(file?.name || '').split('.').pop().toLowerCase();
  const type = kind === 'audio' || kind === 'click' ? AUDIO_EXTENSION_MIME[extension] : '';
  if (!type && file?.type && file.type !== 'application/octet-stream') return file;
  return type ? new File([file], file.name, { type, lastModified: file.lastModified }) : file;
}

function accepts(kind, mime) {
  const rule = accepted[kind];
  return (Array.isArray(rule) ? rule : [rule]).some((prefix) => mime?.startsWith(prefix));
}

function putWithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.setRequestHeader('Content-Type', file.type);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => request.status >= 200 && request.status < 300
      ? resolve()
      : reject(new Error('The media storage upload failed. Check the file and try again.'));
    request.onerror = () => reject(new Error('Could not reach media storage. Check your connection and try again.'));
    request.onabort = () => reject(new Error('The upload was cancelled.'));
    request.send(file);
  });
}

export async function uploadProfileAsset(user, kind, originalFile, onProgress) {
  if (!user?.uid || typeof user.getIdToken !== 'function') throw new Error('Sign in before uploading files.');
  const typedFile = usableFile(originalFile, kind);
  if (!(kind in limitsMb) || !accepts(kind, typedFile?.type)) throw new Error(`Choose a supported ${kind} file.`);
  if (typedFile.size > limitsMb[kind] * 1024 * 1024) throw new Error(`${kind} files can be up to ${limitsMb[kind]} MB.`);
  const preset = imagePresets[kind];
  const file = preset && typedFile.type.startsWith('image/') && typedFile.type !== 'image/gif' && typedFile.size > preset.maxSizeMB * 1024 * 1024
    ? await imageCompression(typedFile, { initialQuality: 0.84, ...preset, useWebWorker: true })
    : typedFile;
  const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const idToken = await user.getIdToken();
  const prepareResponse = await fetch('/api/blob', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'prepare-upload', kind, fileName: file.name, contentType: file.type, size: file.size }),
  });
  const prepared = await prepareResponse.json().catch(() => ({}));
  if (!prepareResponse.ok) throw new Error(prepared.error || 'Could not prepare the media upload.');
  if (prepared.provider === 'r2') {
    await putWithProgress(prepared.uploadUrl, file, onProgress);
    onProgress?.(100);
    return prepared.url;
  }
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
