import { assertProfileDocumentV2Writable } from '../../src/shared/contracts/legacyProfileAdapter.js';
import {
  createDirectoryProfileProjectionV2,
  createPublicProfileProjectionV2,
} from '../../src/shared/contracts/publicProfileV2.js';
import {
  profileDocumentV2Schema,
  profileDraftV2Schema,
} from '../../src/shared/contracts/profileV2.js';
import { assertProfileOwner } from './authClaims.js';

export class ProfileRevisionConflictError extends Error {
  constructor(expected, received) {
    super(`Profile revision conflict: expected ${expected}, received ${received}.`);
    this.name = 'ProfileRevisionConflictError';
    this.code = 'profile_revision_conflict';
    this.expectedRevision = expected;
    this.receivedRevision = received;
  }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function comparableProfile(profile) {
  const {
    createdAtMs,
    revision,
    status,
    updatedAtMs,
    ...content
  } = profile;
  return stableValue(content);
}

export function prepareProfilePublishV2({
  actor,
  currentProfile = null,
  draft,
  tracks = [],
  assets = [],
  shopEnabled = false,
  nowMs = Date.now(),
} = {}) {
  const parsedDraft = profileDraftV2Schema.parse(draft);
  const nextSource = assertProfileDocumentV2Writable(parsedDraft.profile);
  assertProfileOwner(actor, nextSource);
  const current = currentProfile === null ? null : profileDocumentV2Schema.parse(currentProfile);

  if (current) {
    assertProfileOwner(actor, current);
    if (current.username !== nextSource.username) throw new Error('Draft and published usernames must match.');
  }

  const expectedRevision = current?.revision || 0;
  if (parsedDraft.basePublishedRevision !== expectedRevision) {
    throw new ProfileRevisionConflictError(expectedRevision, parsedDraft.basePublishedRevision);
  }

  if (current && JSON.stringify(comparableProfile(current)) === JSON.stringify(comparableProfile(nextSource))) {
    return Object.freeze({ changed: false, revision: current.revision });
  }

  const published = profileDocumentV2Schema.parse({
    ...nextSource,
    revision: expectedRevision + 1,
    status: 'published',
    createdAtMs: current?.createdAtMs || nextSource.createdAtMs,
    updatedAtMs: nowMs,
  });
  const publicProjection = createPublicProfileProjectionV2(published, { tracks, assets });
  const directoryProjection = createDirectoryProfileProjectionV2(publicProjection, { shopEnabled });

  return Object.freeze({
    changed: true,
    revision: published.revision,
    published,
    publicProjection,
    directoryProjection,
    revisionSnapshot: Object.freeze({
      schemaVersion: published.schemaVersion,
      ownerUid: published.ownerUid,
      username: published.username,
      revision: published.revision,
      document: published,
      publishedAtMs: nowMs,
    }),
    draft: profileDraftV2Schema.parse({
      ...parsedDraft,
      basePublishedRevision: published.revision,
      draftRevision: parsedDraft.draftRevision + 1,
      updatedAtMs: nowMs,
      profile: { ...published, status: 'draft' },
    }),
  });
}
