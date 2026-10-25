import { z } from 'zod';

export const UPET_PROFILE_SCHEMA_VERSION = 2;
export const UPET_LYRICS_SCHEMA_VERSION = 1;
export const UPET_MUSIC_SCHEMA_VERSION = 1;
export const UPET_MEDIA_SCHEMA_VERSION = 1;

const id = z.string().min(1).max(120);
const text = (maximum) => z.string().max(maximum);
const nonNegativeInteger = z.number().int().nonnegative();
const boundedRecord = z.record(z.string(), z.unknown());
const optionalAssetUrl = z.string().max(2048);

export const responsiveLayoutSchema = z.object({
  x: z.number().finite().min(0).max(100),
  y: z.number().finite().min(0).max(100_000),
  width: z.number().finite().min(1).max(100),
  height: z.number().finite().min(0).max(100_000),
  rotation: z.number().finite().min(-180).max(180).default(0),
}).passthrough();

export const profileBlockV2Schema = z.object({
  id,
  type: text(80),
  order: nonNegativeInteger,
  visible: z.boolean().default(true),
  layout: z.object({
    desktop: responsiveLayoutSchema,
    mobile: responsiveLayoutSchema.optional(),
  }).passthrough(),
  data: boundedRecord,
  style: boundedRecord,
  accessibility: z.object({
    label: text(160).default(''),
    description: text(500).default(''),
    decorative: z.boolean().default(false),
  }).passthrough().default({ label: '', description: '', decorative: false }),
}).passthrough();

export const profilePageV2Schema = z.object({
  id,
  slug: z.string().max(64).regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/),
  title: text(80),
  order: nonNegativeInteger,
  visible: z.boolean().default(true),
  showInNavigation: z.boolean().default(true),
  blocks: z.array(profileBlockV2Schema).max(100),
}).passthrough();

export const mediaAssetV2Schema = z.object({
  schemaVersion: z.literal(UPET_MEDIA_SCHEMA_VERSION),
  id,
  ownerUid: text(128),
  kind: z.enum(['image', 'video', 'audio', 'document', 'other']),
  provider: z.enum(['firebase-storage', 'vercel-blob', 'r2', 'external', 'legacy']),
  key: text(1024).default(''),
  url: optionalAssetUrl,
  mimeType: text(160).default(''),
  sizeBytes: nonNegativeInteger.nullable().default(null),
  width: nonNegativeInteger.nullable().default(null),
  height: nonNegativeInteger.nullable().default(null),
  durationMs: nonNegativeInteger.nullable().default(null),
  lifecycle: z.enum(['active', 'replaced', 'deleted']).default('active'),
  provenance: z.object({
    type: z.enum(['user-upload', 'licensed', 'original', 'generated', 'public-domain', 'external', 'unknown']),
    rightsConfirmed: z.boolean(),
    note: text(500).default(''),
  }).passthrough(),
  createdAtMs: nonNegativeInteger,
  updatedAtMs: nonNegativeInteger,
}).passthrough();

export const lyricWordTimingV2Schema = z.object({
  id,
  text: text(120),
  startMs: nonNegativeInteger,
  endMs: nonNegativeInteger.nullable(),
}).passthrough().superRefine((word, context) => {
  if (word.endMs !== null && word.endMs <= word.startMs) {
    context.addIssue({ code: 'custom', path: ['endMs'], message: 'Word end time must be after its start time.' });
  }
});

export const lyricLineV2Schema = z.object({
  id,
  text: text(500),
  startMs: nonNegativeInteger.nullable(),
  endMs: nonNegativeInteger.nullable(),
  words: z.array(lyricWordTimingV2Schema).max(300).default([]),
  legacy: boundedRecord.optional(),
}).passthrough().superRefine((line, context) => {
  if (line.startMs !== null && line.endMs !== null && line.endMs <= line.startMs) {
    context.addIssue({ code: 'custom', path: ['endMs'], message: 'Line end time must be after its start time.' });
  }
  if (line.startMs === null && line.endMs !== null) {
    context.addIssue({ code: 'custom', path: ['endMs'], message: 'An unsynced line cannot have an end time.' });
  }
});

export const lyricStanzaV2Schema = z.object({
  id,
  order: nonNegativeInteger,
  label: text(80).default(''),
  lines: z.array(lyricLineV2Schema).max(500),
}).passthrough();

export const lyricsDocumentV2Schema = z.object({
  schemaVersion: z.literal(UPET_LYRICS_SCHEMA_VERSION),
  id,
  ownerUid: text(128),
  trackId: id,
  revision: nonNegativeInteger,
  timingMode: z.enum(['none', 'line', 'word']),
  offsetMs: z.number().int().min(-3_600_000).max(3_600_000),
  language: text(32).default(''),
  stanzas: z.array(lyricStanzaV2Schema).max(200),
  display: boundedRecord.default({}),
  legacy: boundedRecord.optional(),
  updatedAtMs: nonNegativeInteger,
}).passthrough();

export const musicTrackV2Schema = z.object({
  schemaVersion: z.literal(UPET_MUSIC_SCHEMA_VERSION),
  id,
  ownerUid: text(128),
  source: z.object({
    type: z.enum(['upload', 'embed', 'external', 'legacy']),
    assetId: text(120).default(''),
    url: optionalAssetUrl,
    provider: text(40).default(''),
    embedUrl: optionalAssetUrl.default(''),
  }).passthrough(),
  title: text(160),
  artist: text(160),
  album: text(160).default(''),
  artworkAssetId: text(120).default(''),
  artworkUrl: optionalAssetUrl.default(''),
  durationMs: nonNegativeInteger.nullable().default(null),
  rightsConfirmed: z.boolean(),
  lyricsDocumentId: text(120).default(''),
  createdAtMs: nonNegativeInteger,
  updatedAtMs: nonNegativeInteger,
  legacy: boundedRecord.optional(),
}).passthrough();

export const playlistV2Schema = z.object({
  schemaVersion: z.literal(UPET_MUSIC_SCHEMA_VERSION),
  id,
  ownerUid: text(128),
  title: text(160),
  description: text(500).default(''),
  artworkAssetId: text(120).default(''),
  trackIds: z.array(id).max(500),
  visibility: z.enum(['private', 'unlisted', 'public']).default('private'),
  createdAtMs: nonNegativeInteger,
  updatedAtMs: nonNegativeInteger,
}).passthrough();

export const profileDocumentV2Schema = z.object({
  schemaVersion: z.literal(UPET_PROFILE_SCHEMA_VERSION),
  ownerUid: text(128),
  username: z.string().min(1).max(32).regex(/^[a-z0-9][a-z0-9_-]*$/),
  revision: nonNegativeInteger,
  status: z.enum(['draft', 'published', 'archived']),
  identity: z.object({
    displayName: text(80),
    handle: text(32),
    bio: text(2000),
    location: text(160).default(''),
    avatarAssetId: text(120).default(''),
    avatarUrl: optionalAssetUrl.default(''),
    bannerAssetId: text(120).default(''),
    bannerUrl: optionalAssetUrl.default(''),
    badges: z.array(text(64)).max(100).default([]),
  }).passthrough(),
  pages: z.array(profilePageV2Schema).min(1).max(20),
  theme: boundedRecord,
  seo: z.object({
    title: text(120).default(''),
    description: text(320).default(''),
    imageAssetId: text(120).default(''),
  }).passthrough(),
  music: z.object({
    trackIds: z.array(id).max(500),
    playlistIds: z.array(id).max(100),
    defaultTrackId: text(120).default(''),
  }).passthrough(),
  mediaAssetIds: z.array(id).max(2000),
  compatibility: z.object({
    source: z.enum(['native-v2', 'legacy-flat', 'legacy-v1', 'legacy-redesign']),
    sourceSchemaVersion: nonNegativeInteger,
    writeMode: z.enum(['enabled', 'blocked-until-roundtrip']),
    legacySnapshot: z.unknown().optional(),
  }).passthrough(),
  createdAtMs: nonNegativeInteger,
  updatedAtMs: nonNegativeInteger,
}).passthrough();

export const profileDraftV2Schema = z.object({
  schemaVersion: z.literal(UPET_PROFILE_SCHEMA_VERSION),
  ownerUid: text(128),
  username: z.string().min(1).max(32),
  basePublishedRevision: nonNegativeInteger,
  draftRevision: nonNegativeInteger,
  updatedAtMs: nonNegativeInteger,
  profile: profileDocumentV2Schema,
}).passthrough().superRefine((draft, context) => {
  if (draft.ownerUid !== draft.profile.ownerUid) {
    context.addIssue({ code: 'custom', path: ['ownerUid'], message: 'Draft and profile owners must match.' });
  }
  if (draft.username !== draft.profile.username) {
    context.addIssue({ code: 'custom', path: ['username'], message: 'Draft and profile usernames must match.' });
  }
});

export const legacyProfileMigrationBundleSchema = z.object({
  profile: profileDocumentV2Schema,
  tracks: z.array(musicTrackV2Schema).max(500),
  playlists: z.array(playlistV2Schema).max(100),
  lyrics: z.array(lyricsDocumentV2Schema).max(500),
  assets: z.array(mediaAssetV2Schema).max(2000),
}).passthrough();

export function createEmptyProfileDocumentV2({ ownerUid = '', username = '', nowMs = Date.now() } = {}) {
  const normalizedUsername = String(username).trim().toLowerCase();
  return profileDocumentV2Schema.parse({
    schemaVersion: UPET_PROFILE_SCHEMA_VERSION,
    ownerUid,
    username: normalizedUsername,
    revision: 0,
    status: 'draft',
    identity: {
      displayName: normalizedUsername,
      handle: normalizedUsername,
      bio: '',
      location: '',
      avatarAssetId: '',
      avatarUrl: '',
      bannerAssetId: '',
      bannerUrl: '',
      badges: [],
    },
    pages: [{
      id: 'home',
      slug: '',
      title: 'Home',
      order: 0,
      visible: true,
      showInNavigation: true,
      blocks: [],
    }],
    theme: {},
    seo: { title: '', description: '', imageAssetId: '' },
    music: { trackIds: [], playlistIds: [], defaultTrackId: '' },
    mediaAssetIds: [],
    compatibility: {
      source: 'native-v2',
      sourceSchemaVersion: UPET_PROFILE_SCHEMA_VERSION,
      writeMode: 'enabled',
    },
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
  });
}

export function createProfileDraftV2(profile, { basePublishedRevision = 0, draftRevision = 0, nowMs = Date.now() } = {}) {
  const parsedProfile = profileDocumentV2Schema.parse(profile);
  return profileDraftV2Schema.parse({
    schemaVersion: UPET_PROFILE_SCHEMA_VERSION,
    ownerUid: parsedProfile.ownerUid,
    username: parsedProfile.username,
    basePublishedRevision,
    draftRevision,
    updatedAtMs: nowMs,
    profile: { ...parsedProfile, status: 'draft', updatedAtMs: nowMs },
  });
}
