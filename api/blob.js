import { del, list } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';
import { bearerToken, verifyFirebaseToken } from '../server/firebaseAuth.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/flac'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const ASSET_RULES = {
  avatar: { types: IMAGE_TYPES, max: 5 },
  banner: { types: IMAGE_TYPES, max: 10 },
  cursor: { types: IMAGE_TYPES, max: 5 },
  cover: { types: IMAGE_TYPES, max: 5 },
  image: { types: IMAGE_TYPES, max: 10 },
  audio: { types: AUDIO_TYPES, max: 20 },
  click: { types: AUDIO_TYPES, max: 5 },
  background: { types: [...IMAGE_TYPES, ...VIDEO_TYPES], max: 100 },
  video: { types: VIDEO_TYPES, max: 100 },
};

function json(value, status = 200) {
  return Response.json(value, { status });
}

function ownedBlobUrl(value, uid) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:'
      && url.hostname.endsWith('.blob.vercel-storage.com')
      && url.pathname.startsWith(`/profiles/${uid}/`);
  } catch {
    return false;
  }
}

export default async function handler(request) {
  try {
    if (request.method === 'POST') {
      const body = await request.json();
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const payload = JSON.parse(clientPayload || '{}');
          const account = await verifyFirebaseToken(payload.idToken);
          const kind = String(payload.kind || '');
          const rule = ASSET_RULES[kind];
          if (!rule) throw new Error('That file type is not supported.');
          if (!String(pathname).startsWith(`profiles/${account.uid}/${kind}-`)) {
            throw new Error('The upload path is invalid.');
          }

          return {
            allowedContentTypes: rule.types,
            maximumSizeInBytes: rule.max * 1024 * 1024,
            addRandomSuffix: true,
            cacheControlMaxAge: 86400,
            tokenPayload: JSON.stringify({ uid: account.uid, kind }),
          };
        },
        onUploadCompleted: async () => {},
      });
      return json(result);
    }

    const account = await verifyFirebaseToken(bearerToken(request));

    if (request.method === 'GET') {
      const result = await list({ prefix: `profiles/${account.uid}/`, limit: 100 });
      return json({ blobs: result.blobs });
    }

    if (request.method === 'DELETE') {
      const { url } = await request.json();
      if (!ownedBlobUrl(url, account.uid)) return json({ error: 'That file does not belong to this profile.' }, 403);
      await del(url);
      return json({ ok: true });
    }

    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blob request failed.';
    return json({ error: message }, message.includes('Sign in') ? 401 : 400);
  }
}
