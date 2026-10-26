import sharp from 'sharp';
import { isAllowedPreviewSource, previewWidth } from '../server/mediaPreview.js';

const MAX_SOURCE_BYTES = 50 * 1024 * 1024;

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });

  const source = Array.isArray(request.query?.url) ? request.query.url[0] : request.query?.url;
  if (!isAllowedPreviewSource(source)) return response.status(400).json({ error: 'Invalid media URL.' });

  try {
    const upstream = await fetch(source, { signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) throw new Error('Media could not be loaded.');
    if (!String(upstream.headers.get('content-type') || '').toLowerCase().startsWith('image/')) throw new Error('Media is not an image.');
    const declaredSize = Number(upstream.headers.get('content-length') || 0);
    if (declaredSize > MAX_SOURCE_BYTES) throw new Error('Media is too large for a preview.');

    const input = Buffer.from(await upstream.arrayBuffer());
    if (!input.length || input.length > MAX_SOURCE_BYTES) throw new Error('Media is too large for a preview.');
    const output = await sharp(input, { animated: false, failOn: 'none', limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: previewWidth(request.query?.w), fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 68, effort: 3 })
      .toBuffer();

    response.setHeader('Content-Type', 'image/webp');
    response.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    return response.status(200).send(output);
  } catch (error) {
    return response.status(422).json({ error: error instanceof Error ? error.message : 'Preview could not be created.' });
  }
}
