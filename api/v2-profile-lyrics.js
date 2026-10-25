import { database } from '../server/visitorStore.js';
import { loadPublicLyricsV2 } from '../server/v2/publicLyricsService.js';
import { PublicProfileNotFoundError } from '../server/v2/publicProfileService.js';

export function createPublicV2LyricsHandler({ getDatabase = database } = {}) {
  return async function publicV2LyricsHandler(request, response) {
    response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=30');
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      return response.status(405).json({ error: 'Method not allowed.' });
    }
    try {
      const lyrics = await loadPublicLyricsV2(getDatabase(), request.query?.username, request.query?.trackId);
      return response.status(200).json({ lyrics });
    } catch (error) {
      if (error instanceof PublicProfileNotFoundError) return response.status(404).json({ error: 'Lyrics not found.' });
      if (/Invalid username|Invalid track identifier/.test(error?.message || '')) {
        return response.status(400).json({ error: error.message });
      }
      console.error('Public v2 lyrics request failed:', error);
      return response.status(503).json({ error: 'Lyrics are temporarily unavailable.' });
    }
  };
}

export default createPublicV2LyricsHandler();
