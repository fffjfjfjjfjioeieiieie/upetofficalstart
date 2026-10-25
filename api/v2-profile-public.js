import { database } from '../server/visitorStore.js';
import {
  loadPublicProfileV2,
  PublicProfileNotFoundError,
} from '../server/v2/publicProfileService.js';

export function createPublicV2ProfileHandler({ getDatabase = database } = {}) {
  return async function publicV2ProfileHandler(request, response) {
    response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=30');
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      return response.status(405).json({ error: 'Method not allowed.' });
    }
    try {
      const profile = await loadPublicProfileV2(getDatabase(), request.query?.username);
      return response.status(200).json({ profile });
    } catch (error) {
      if (error instanceof PublicProfileNotFoundError) return response.status(404).json({ error: 'Profile not found.' });
      if (/Invalid username/.test(error?.message || '')) return response.status(400).json({ error: 'Invalid username.' });
      console.error('Public v2 profile request failed:', error);
      return response.status(503).json({ error: 'Profile is temporarily unavailable.' });
    }
  };
}

export default createPublicV2ProfileHandler();
