import { bearerToken, verifyFirebaseIdentity } from '../server/firebaseAuth.js';
import { database } from '../server/visitorStore.js';
import { hasTrustedRole } from '../server/v2/authClaims.js';
import { createFirestoreProfileV2Repository } from '../server/v2/firestoreProfileRepository.js';
import { ProfileRevisionConflictError } from '../server/v2/profilePublish.js';
import { invalidatePublicProfileV2 } from '../server/v2/publicProfileService.js';
import { invalidatePublicLyricsV2 } from '../server/v2/publicLyricsService.js';

const fail = (response, status, error) => response.status(status).json({ error });
const bodyOf = (request) => typeof request.body === 'object' && request.body !== null
  ? request.body
  : JSON.parse(request.body || '{}');

export function createV2ProfileHandler({
  enabled = () => process.env.UPET_V2_PROFILE_API_ENABLED === 'true',
  getDatabase = database,
  verifyIdentity = (request) => verifyFirebaseIdentity(bearerToken(request)),
  invalidate = invalidatePublicProfileV2,
  invalidateLyrics = invalidatePublicLyricsV2,
} = {}) {
  return async function v2ProfileHandler(request, response) {
    response.setHeader('Cache-Control', 'no-store');
    if (!enabled()) return fail(response, 404, 'The v2 profile preview is not enabled.');
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return fail(response, 405, 'Method not allowed.');
    }
    if (Number(request.headers?.['content-length'] || 0) > 256 * 1024) return fail(response, 413, 'Request is too large.');

    let actor;
    try { actor = await verifyIdentity(request); }
    catch { return fail(response, 401, 'Sign in to use the v2 profile preview.'); }
    if (!hasTrustedRole(actor, 'founder')) return fail(response, 403, 'Founder preview access is required.');

    try {
      const body = bodyOf(request);
      const repository = createFirestoreProfileV2Repository({
        db: getDatabase(),
        invalidatePublicProfile: invalidate,
        invalidatePublicLyrics: invalidateLyrics,
      });
      if (body.action === 'saveDraft') {
        const result = await repository.saveDraft({
          actor,
          username: body.username,
          profile: body.profile,
          basePublishedRevision: body.basePublishedRevision,
          expectedDraftRevision: body.expectedDraftRevision,
        });
        return response.status(200).json(result);
      }
      if (body.action === 'publish') {
        const result = await repository.publish({ actor, username: body.username });
        return response.status(200).json({ changed: result.changed, revision: result.revision, draftRevision: result.draft?.draftRevision ?? null });
      }
      return fail(response, 400, 'Unknown v2 profile action.');
    } catch (error) {
      if (error instanceof ProfileRevisionConflictError) {
        return fail(response, 409, error.message);
      }
      console.error('V2 profile publish failed:', error);
      return fail(response, 400, error?.message || 'V2 profile publish failed.');
    }
  };
}

export default createV2ProfileHandler();
