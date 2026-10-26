import { createHash } from 'node:crypto';
import { prepareProfilePublishV2 } from './profilePublish.js';
import { projectPublicLyricsV2 } from './publicLyricsService.js';
import { assertProfileDocumentV2Writable } from '../../src/shared/contracts/legacyProfileAdapter.js';
import { assertProfileMaterialConfigs } from '../../src/graphics/materials/materialRegistry.js';
import { profileDraftV2Schema } from '../../src/shared/contracts/profileV2.js';
import { assertProfileOwner } from './authClaims.js';
import { ProfileRevisionConflictError } from './profilePublish.js';

export const PROFILE_V2_COLLECTIONS = Object.freeze({
  canonical: 'profileV2Canonical',
  drafts: 'profileV2Drafts',
  public: 'profileV2Public',
  directory: 'profileV2Directory',
  revisions: 'profileV2Revisions',
  tracks: 'profileV2Tracks',
  assets: 'profileV2Assets',
  lyrics: 'profileV2Lyrics',
  publicLyrics: 'profileV2PublicLyrics',
});

export const PROFILE_V2_PUBLISH_LIMITS = Object.freeze({
  tracks: 100,
  assets: 200,
});

const dataOrNull = (snapshot) => snapshot?.exists ? snapshot.data() : null;

export function createFirestoreProfileV2Repository({
  db,
  collections = PROFILE_V2_COLLECTIONS,
  now = () => Date.now(),
  invalidatePublicProfile = () => {},
  invalidatePublicLyrics = () => {},
} = {}) {
  if (!db?.doc || !db?.runTransaction) throw new TypeError('A trusted Firestore Admin database is required.');

  const ref = (collection, id) => db.doc(`${collection}/${id}`);

  async function saveDraft({ actor, username, profile, basePublishedRevision, expectedDraftRevision } = {}) {
    if (!actor?.uid) throw new Error('A verified server identity is required.');
    const normalizedUsername = String(username || '').trim().toLowerCase();
    if (!normalizedUsername || !Number.isSafeInteger(basePublishedRevision) || !Number.isSafeInteger(expectedDraftRevision)) {
      throw new Error('Username and both expected revisions are required.');
    }
    const incoming = assertProfileMaterialConfigs(assertProfileDocumentV2Writable(profile));
    assertProfileOwner(actor, incoming);
    if (incoming.username !== normalizedUsername) throw new Error('The draft username does not match the account.');
    const savedAtMs = now();

    return db.runTransaction(async (transaction) => {
      const draftReference = ref(collections.drafts, actor.uid);
      const canonicalReference = ref(collections.canonical, normalizedUsername);
      const [draftSnapshot, canonicalSnapshot, usernameSnapshot, accountSnapshot] = await Promise.all([
        transaction.get(draftReference),
        transaction.get(canonicalReference),
        transaction.get(ref('usernames', normalizedUsername)),
        transaction.get(ref('users', actor.uid)),
      ]);
      if (dataOrNull(usernameSnapshot)?.uid !== actor.uid || dataOrNull(accountSnapshot)?.username !== normalizedUsername) {
        throw new Error('This username is not claimed by the editing account.');
      }
      const currentDraft = dataOrNull(draftSnapshot);
      const currentPublished = dataOrNull(canonicalSnapshot);
      const actualPublishedRevision = currentPublished?.revision || 0;
      const actualDraftRevision = currentDraft?.draftRevision || 0;
      if (actualPublishedRevision !== basePublishedRevision) {
        throw new ProfileRevisionConflictError(actualPublishedRevision, basePublishedRevision);
      }
      if (actualDraftRevision !== expectedDraftRevision) {
        throw new ProfileRevisionConflictError(actualDraftRevision, expectedDraftRevision);
      }
      if (currentDraft && (currentDraft.ownerUid !== actor.uid || currentDraft.username !== normalizedUsername)) {
        throw new Error('The current draft does not belong to this account.');
      }
      if (currentDraft?.basePublishedRevision !== undefined && currentDraft.basePublishedRevision !== actualPublishedRevision) {
        throw new ProfileRevisionConflictError(actualPublishedRevision, currentDraft.basePublishedRevision);
      }
      const nextProfile = {
        ...incoming,
        revision: actualPublishedRevision,
        status: 'draft',
        createdAtMs: currentDraft?.profile?.createdAtMs || currentPublished?.createdAtMs || incoming.createdAtMs,
      };
      const comparable = ({ updatedAtMs, ...value }) => JSON.stringify(value);
      if (currentDraft && comparable(currentDraft.profile) === comparable(nextProfile)) {
        return { changed: false, draftRevision: actualDraftRevision, basePublishedRevision: actualPublishedRevision };
      }
      const savedDraft = profileDraftV2Schema.parse({
        schemaVersion: 2,
        ownerUid: actor.uid,
        username: normalizedUsername,
        basePublishedRevision: actualPublishedRevision,
        draftRevision: actualDraftRevision + 1,
        updatedAtMs: savedAtMs,
        profile: { ...nextProfile, updatedAtMs: savedAtMs },
      });
      transaction.set(draftReference, savedDraft);
      return { changed: true, draftRevision: savedDraft.draftRevision, basePublishedRevision: actualPublishedRevision };
    });
  }

  async function publish({ actor, username, shopEnabled = false } = {}) {
    if (!actor?.uid) throw new Error('A verified server identity is required.');
    const normalizedUsername = String(username || '').trim().toLowerCase();
    if (!normalizedUsername) throw new Error('A username is required.');
    const publishedAtMs = now();

    const result = await db.runTransaction(async (transaction) => {
      const draftReference = ref(collections.drafts, actor.uid);
      const canonicalReference = ref(collections.canonical, normalizedUsername);
      const publicReference = ref(collections.public, normalizedUsername);
      const usernameReference = ref('usernames', normalizedUsername);
      const accountReference = ref('users', actor.uid);
      const [draftSnapshot, canonicalSnapshot, publicSnapshot, usernameSnapshot, accountSnapshot] = await Promise.all([
        transaction.get(draftReference),
        transaction.get(canonicalReference),
        transaction.get(publicReference),
        transaction.get(usernameReference),
        transaction.get(accountReference),
      ]);
      const draft = dataOrNull(draftSnapshot);
      const currentProfile = dataOrNull(canonicalSnapshot);
      if (!draft) throw new Error('No v2 draft exists for this account.');
      if (draft.username !== normalizedUsername) throw new Error('The v2 draft belongs to a different username.');
      if (dataOrNull(usernameSnapshot)?.uid !== actor.uid || dataOrNull(accountSnapshot)?.username !== normalizedUsername) {
        throw new Error('This username is not claimed by the publishing account.');
      }

      const trackIds = draft.profile?.music?.trackIds || [];
      const assetIds = draft.profile?.mediaAssetIds || [];
      if (trackIds.length > PROFILE_V2_PUBLISH_LIMITS.tracks) throw new Error('This profile references too many tracks to publish safely.');
      if (assetIds.length > PROFILE_V2_PUBLISH_LIMITS.assets) throw new Error('This profile references too many media assets to publish safely.');

      const trackSnapshots = await Promise.all(trackIds.map((trackId) => transaction.get(ref(collections.tracks, trackId))));
      const assetSnapshots = await Promise.all(assetIds.map((assetId) => transaction.get(ref(collections.assets, assetId))));
      const tracks = trackSnapshots.map(dataOrNull).filter(Boolean);
      const assets = assetSnapshots.map(dataOrNull).filter(Boolean);
      const lyricsTracks = tracks.filter((track) => track.lyricsDocumentId);
      const lyricsSnapshots = await Promise.all(lyricsTracks.map((track) => transaction.get(ref(collections.lyrics, track.lyricsDocumentId))));
      const publicLyrics = lyricsTracks.map((track, index) => {
        const source = dataOrNull(lyricsSnapshots[index]);
        if (!source || source.ownerUid !== actor.uid || source.trackId !== track.id) {
          throw new Error(`Missing or mismatched lyrics for track ${track.id}.`);
        }
        return { trackId: track.id, document: projectPublicLyricsV2(source) };
      });
      const publishedLyricsSnapshots = await Promise.all(publicLyrics.map((item) =>
        transaction.get(ref(collections.publicLyrics, `${normalizedUsername}_${item.trackId}`))));
      const lyricsChanged = publicLyrics.some((item, index) =>
        JSON.stringify(dataOrNull(publishedLyricsSnapshots[index])) !== JSON.stringify(item.document));
      const dependenciesSignature = createHash('sha256')
        .update(JSON.stringify({ tracks, assets, publicLyrics }))
        .digest('hex');
      const plan = prepareProfilePublishV2({
        actor,
        currentProfile,
        draft,
        tracks,
        assets,
        shopEnabled,
        forceChanged: lyricsChanged,
        dependenciesSignature,
        nowMs: publishedAtMs,
      });
      if (!plan.changed) return plan;

      const previousTrackIds = (dataOrNull(publicSnapshot)?.music?.tracks || [])
        .filter((track) => track.lyricsDocumentId)
        .map((track) => track.id);
      const currentLyricsIds = new Set(publicLyrics.map((item) => item.trackId));

      transaction.set(canonicalReference, plan.published);
      transaction.set(publicReference, plan.publicProjection);
      transaction.set(ref(collections.directory, normalizedUsername), plan.directoryProjection);
      transaction.set(ref(collections.revisions, `${normalizedUsername}_${plan.revision}`), plan.revisionSnapshot);
      transaction.set(draftReference, plan.draft);
      for (const item of publicLyrics) {
        transaction.set(ref(collections.publicLyrics, `${normalizedUsername}_${item.trackId}`), item.document);
      }
      for (const trackId of previousTrackIds) {
        if (!currentLyricsIds.has(trackId)) transaction.delete(ref(collections.publicLyrics, `${normalizedUsername}_${trackId}`));
      }
      return plan;
    });

    if (result.changed) {
      await Promise.all([
        invalidatePublicProfile(normalizedUsername),
        invalidatePublicLyrics(normalizedUsername),
      ]);
    }
    return result;
  }

  return Object.freeze({ publish, saveDraft });
}
