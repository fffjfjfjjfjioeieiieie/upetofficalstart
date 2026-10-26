import { del, list } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';
import { bearerToken, verifyFirebaseIdentity } from '../server/firebaseAuth.js';
import { createR2Upload, deleteR2Media, listR2Media, r2MediaConfigured } from '../server/r2Media.js';
import { AUDIO_MIME_TYPES } from '../src/shared/mediaTypes.js';
import { consumeUploadQuota, RateLimitError } from '../server/rateLimit.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const ASSET_RULES = {
  avatar: { types: [...IMAGE_TYPES, ...VIDEO_TYPES], max: 20 },
  banner: { types: [...IMAGE_TYPES, ...VIDEO_TYPES], max: 50 },
  cursor: { types: IMAGE_TYPES, max: 5 },
  cover: { types: IMAGE_TYPES, max: 5 },
  image: { types: IMAGE_TYPES, max: 10 },
  audio: { types: AUDIO_MIME_TYPES, max: 20 },
  click: { types: AUDIO_MIME_TYPES, max: 5 },
  background: { types: [...IMAGE_TYPES, ...VIDEO_TYPES], max: 100 },
  video: { types: VIDEO_TYPES, max: 100 },
};

function parsedBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return JSON.parse(request.body);
  return {};
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

export default async function handler(request, response) {
  try {
    if (request.method === 'POST') {
      const body = parsedBody(request);
      if (body.action === 'prepare-upload') {
        const account = await verifyFirebaseIdentity(bearerToken(request));
        if (!r2MediaConfigured()) return response.status(200).json({ provider: 'vercel-blob' });
        const kind = String(body.kind || '');
        const rule = ASSET_RULES[kind];
        const contentType = String(body.contentType || '');
        const size = Number(body.size || 0);
        if (!rule || !rule.types.includes(contentType)) throw new Error('That file type is not supported.');
        if (!Number.isSafeInteger(size) || size < 1 || size > rule.max * 1024 * 1024) throw new Error(`Files must be smaller than ${rule.max} MB.`);
        await consumeUploadQuota(account.uid, kind);
        const result = await createR2Upload({ uid: account.uid, kind, fileName: body.fileName, contentType, size });
        return response.status(200).json(result);
      }
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const payload = JSON.parse(clientPayload || '{}');
          // Every signed-in profile owner may upload media. Keep authorization
          // scoped to their Firebase UID below rather than limiting uploads to founders.
          const account = await verifyFirebaseIdentity(payload.idToken);
          const kind = String(payload.kind || '');
          const rule = ASSET_RULES[kind];
          if (!rule) throw new Error('That file type is not supported.');
          if (!String(pathname).startsWith(`profiles/${account.uid}/${kind}-`)) {
            throw new Error('The upload path is invalid.');
          }
          await consumeUploadQuota(account.uid, kind);

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
      return response.status(200).json(result);
    }

    const account = await verifyFirebaseIdentity(bearerToken(request));

    if (request.method === 'GET') {
      const r2Items = r2MediaConfigured() ? await listR2Media(account.uid) : [];
      const blobItems = await list({ prefix: `profiles/${account.uid}/`, limit: 100 }).then((result) => result.blobs).catch(() => []);
      return response.status(200).json({ blobs: [...r2Items, ...blobItems], provider: r2MediaConfigured() ? 'r2' : 'vercel-blob' });
    }

    if (request.method === 'DELETE') {
      const { url } = parsedBody(request);
      if (r2MediaConfigured() && await deleteR2Media(url, account.uid)) return response.status(200).json({ ok: true });
      if (!ownedBlobUrl(url, account.uid)) return response.status(403).json({ error: 'That file does not belong to this profile.' });
      await del(url);
      return response.status(200).json({ ok: true });
    }

    return response.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blob request failed.';
    if (error instanceof RateLimitError) {
      response.setHeader('Retry-After', String(error.retryAfterSeconds));
      return response.status(429).json({ error: message, retryAfter: error.retryAfterSeconds });
    }
    return response.status(message.includes('Sign in') ? 401 : 400).json({ error: message });
  }
}
