import { prepareProfilePublishV2 } from './profilePublish.js';

export const PROFILE_V2_COLLECTIONS = Object.freeze({
  canonical: 'profileV2Canonical',
  drafts: 'profileV2Drafts',
  public: 'profileV2Public',
  directory: 'profileV2Directory',
  revisions: 'profileV2Revisions',
  tracks: 'profileV2Tracks',
  assets: 'profileV2Assets',
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
} = {}) {
  if (!db?.doc || !db?.runTransaction) throw new TypeError('A trusted Firestore Admin database is required.');

  const ref = (collection, id) => db.doc(`${collection}/${id}`);

  async function publish({ actor, username, shopEnabled = false } = {}) {
    if (!actor?.uid) throw new Error('A verified server identity is required.');
    const normalizedUsername = String(username || '').trim().toLowerCase();
    if (!normalizedUsername) throw new Error('A username is required.');
    const publishedAtMs = now();

    const result = await db.runTransaction(async (transaction) => {
      const draftReference = ref(collections.drafts, actor.uid);
      const canonicalReference = ref(collections.canonical, normalizedUsername);
      const [draftSnapshot, canonicalSnapshot] = await Promise.all([
        transaction.get(draftReference),
        transaction.get(canonicalReference),
      ]);
      const draft = dataOrNull(draftSnapshot);
      const currentProfile = dataOrNull(canonicalSnapshot);
      if (!draft) throw new Error('No v2 draft exists for this account.');
      if (draft.username !== normalizedUsername) throw new Error('The v2 draft belongs to a different username.');

      const trackIds = draft.profile?.music?.trackIds || [];
      const assetIds = draft.profile?.mediaAssetIds || [];
      if (trackIds.length > PROFILE_V2_PUBLISH_LIMITS.tracks) throw new Error('This profile references too many tracks to publish safely.');
      if (assetIds.length > PROFILE_V2_PUBLISH_LIMITS.assets) throw new Error('This profile references too many media assets to publish safely.');

      const trackSnapshots = await Promise.all(trackIds.map((trackId) => transaction.get(ref(collections.tracks, trackId))));
      const assetSnapshots = await Promise.all(assetIds.map((assetId) => transaction.get(ref(collections.assets, assetId))));
      const tracks = trackSnapshots.map(dataOrNull).filter(Boolean);
      const assets = assetSnapshots.map(dataOrNull).filter(Boolean);
      const plan = prepareProfilePublishV2({
        actor,
        currentProfile,
        draft,
        tracks,
        assets,
        shopEnabled,
        nowMs: publishedAtMs,
      });
      if (!plan.changed) return plan;

      transaction.set(canonicalReference, plan.published);
      transaction.set(ref(collections.public, normalizedUsername), plan.publicProjection);
      transaction.set(ref(collections.directory, normalizedUsername), plan.directoryProjection);
      transaction.set(ref(collections.revisions, `${normalizedUsername}_${plan.revision}`), plan.revisionSnapshot);
      transaction.set(draftReference, plan.draft);
      return plan;
    });

    if (result.changed) await invalidatePublicProfile(normalizedUsername);
    return result;
  }

  return Object.freeze({ publish });
}
