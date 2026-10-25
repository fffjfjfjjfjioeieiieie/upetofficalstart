import { z } from 'zod';
import {
  mediaAssetV2Schema,
  musicTrackV2Schema,
  profileDocumentV2Schema,
  UPET_PROFILE_SCHEMA_VERSION,
} from './profileV2.js';

const id = z.string().min(1).max(120);
const text = (maximum) => z.string().max(maximum);
const nonNegativeInteger = z.number().int().nonnegative();

const publicResponsiveLayoutSchema = z.object({
  x: z.number().finite().min(0).max(100),
  y: z.number().finite().min(0).max(100_000),
  width: z.number().finite().min(1).max(100),
  height: z.number().finite().min(0).max(100_000),
  rotation: z.number().finite().min(-180).max(180),
}).strict();

const publicBlockSchema = z.object({
  id,
  type: text(80),
  order: nonNegativeInteger,
  layout: z.object({
    desktop: publicResponsiveLayoutSchema,
    mobile: publicResponsiveLayoutSchema.optional(),
  }).strict(),
  data: z.record(z.string(), z.unknown()),
  style: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  accessibility: z.object({
    label: text(160),
    description: text(500),
    decorative: z.boolean(),
  }).strict(),
}).strict();

const publicPageSchema = z.object({
  id,
  slug: z.string().max(64),
  title: text(80),
  order: nonNegativeInteger,
  showInNavigation: z.boolean(),
  blocks: z.array(publicBlockSchema).max(100),
}).strict();

const publicMusicTrackSchema = z.object({
  id,
  source: z.object({
    type: z.enum(['upload', 'embed', 'external', 'legacy']),
    url: z.string().max(2048),
    provider: text(40),
    embedUrl: z.string().max(2048),
  }).strict(),
  title: text(160),
  artist: text(160),
  album: text(160),
  artworkUrl: z.string().max(2048),
  durationMs: nonNegativeInteger.nullable(),
  lyricsDocumentId: text(120),
}).strict();

const publicMediaAssetSchema = z.object({
  id,
  kind: z.enum(['image', 'video', 'audio', 'document', 'other']),
  url: z.string().max(2048),
  mimeType: text(160),
  width: nonNegativeInteger.nullable(),
  height: nonNegativeInteger.nullable(),
  durationMs: nonNegativeInteger.nullable(),
}).strict();

export const publicProfileProjectionV2Schema = z.object({
  schemaVersion: z.literal(UPET_PROFILE_SCHEMA_VERSION),
  username: z.string().min(1).max(32),
  revision: nonNegativeInteger,
  identity: z.object({
    displayName: text(80),
    handle: text(32),
    bio: text(2000),
    location: text(160),
    avatarUrl: z.string().max(2048),
    bannerUrl: z.string().max(2048),
    badges: z.array(text(64)).max(100),
  }).strict(),
  pages: z.array(publicPageSchema).min(1).max(20),
  theme: z.record(z.string(), z.unknown()),
  seo: z.object({
    title: text(120),
    description: text(320),
    imageAssetId: text(120),
  }).strict(),
  music: z.object({
    defaultTrackId: text(120),
    tracks: z.array(publicMusicTrackSchema).max(500),
  }).strict(),
  media: z.array(publicMediaAssetSchema).max(2000),
  updatedAtMs: nonNegativeInteger,
}).strict();

export const directoryProfileProjectionV2Schema = z.object({
  schemaVersion: z.literal(UPET_PROFILE_SCHEMA_VERSION),
  username: z.string().min(1).max(32),
  revision: nonNegativeInteger,
  displayName: text(80),
  bio: text(280),
  avatarUrl: z.string().max(2048),
  badges: z.array(text(64)).max(20),
  accent: text(64),
  shopEnabled: z.boolean(),
  updatedAtMs: nonNegativeInteger,
}).strict();

const BLOCK_FIELDS = Object.freeze({
  identity: ['displayName', 'handle', 'bio', 'location', 'avatarUrl', 'bannerUrl', 'badges'],
  link: ['label', 'url', 'platform', 'icon', 'description'],
  socials: ['items', 'title'],
  heading: ['text', 'level', 'subtitle'],
  text: ['text', 'markdown', 'alignment'],
  image: ['assetId', 'src', 'alt', 'caption', 'fit', 'href'],
  gallery: ['items', 'title', 'layout', 'columns'],
  video: ['assetId', 'src', 'embedUrl', 'provider', 'poster', 'controls', 'autoplay', 'loop', 'muted', 'caption'],
  divider: ['variant', 'label'],
  music: ['trackId', 'playlistId', 'layout', 'showArtwork', 'showLyrics'],
  featured: ['title', 'description', 'href', 'assetId', 'imageUrl', 'label'],
  skills: ['title', 'items'],
  project: ['title', 'description', 'href', 'imageAssetId', 'imageUrl', 'tags'],
  quote: ['text', 'attribution'],
  discordPresence: ['userId', 'username', 'handle', 'avatar', 'banner', 'status', 'activity', 'publicFlags'],
  discordServer: ['serverId', 'name', 'icon', 'description', 'memberCount', 'inviteUrl'],
});

const STYLE_FIELDS = Object.freeze([
  'accent',
  'alignment',
  'aspectRatio',
  'background',
  'borderColor',
  'columns',
  'color',
  'font',
  'fontSize',
  'gap',
  'opacity',
  'padding',
  'radius',
  'shadow',
  'variant',
  'weight',
]);

const BLOCK_ITEM_FIELDS = Object.freeze({
  gallery: ['assetId', 'src', 'alt', 'caption', 'href'],
  skills: ['label', 'level', 'description'],
  socials: ['label', 'url', 'platform', 'icon'],
});

const THEME_OBJECT_FIELDS = Object.freeze({
  background: ['type', 'color', 'gradient', 'assetId', 'url', 'fit', 'positionX', 'positionY', 'scale', 'blur', 'brightness', 'saturation', 'overlay', 'overlayOpacity'],
  colors: ['accent', 'secondary', 'text', 'muted', 'surface', 'visualizer'],
  effects: ['background', 'displayName', 'username', 'bio', 'card', 'overlay', 'intensity', 'animationSpeed', 'enableTilt', 'grain', 'animatedAccent', 'animatedTitle', 'reducedMotionMode'],
  material: ['id', 'preset', 'quality', 'intensity', 'speed', 'color', 'secondaryColor'],
  surface: ['enabled', 'opacity', 'blur', 'radius', 'borderColor', 'borderWidth', 'shadow'],
  typography: ['pageFont', 'displayFont', 'linkFont', 'displayWeight', 'letterSpacing', 'textCase'],
});

const jsonClone = (value) => globalThis.structuredClone
  ? globalThis.structuredClone(value)
  : JSON.parse(JSON.stringify(value));
const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function pick(source, fields) {
  if (!isRecord(source)) return {};
  return Object.fromEntries(fields
    .filter((field) => source[field] !== undefined)
    .map((field) => [field, jsonClone(source[field])]));
}

function publicBlockData(block) {
  const fields = BLOCK_FIELDS[block.type];
  const data = pick(block.data, fields);
  const itemFields = BLOCK_ITEM_FIELDS[block.type];
  if (itemFields && Array.isArray(data.items)) {
    data.items = data.items.slice(0, 100).map((item) => {
      if (typeof item === 'string') return item.slice(0, 500);
      return pick(item, itemFields);
    });
  }
  if (Array.isArray(data.tags)) {
    data.tags = data.tags.slice(0, 50).map((tag) => String(tag).slice(0, 80));
  }
  if (Array.isArray(data.badges)) {
    data.badges = data.badges.slice(0, 100).map((badge) => String(badge).slice(0, 64));
  }
  return data;
}

function publicTheme(theme) {
  const projected = pick(theme, ['alignment', 'density', 'layout', 'width']);
  for (const [field, fields] of Object.entries(THEME_OBJECT_FIELDS)) {
    if (isRecord(theme?.[field])) projected[field] = pick(theme[field], fields);
  }
  return projected;
}

function publicBlock(block) {
  const fields = BLOCK_FIELDS[block.type];
  if (!fields || block.visible === false) return null;
  return publicBlockSchema.parse({
    id: block.id,
    type: block.type,
    order: block.order,
    layout: {
      desktop: pick(block.layout.desktop, ['x', 'y', 'width', 'height', 'rotation']),
      ...(block.layout.mobile ? { mobile: pick(block.layout.mobile, ['x', 'y', 'width', 'height', 'rotation']) } : {}),
    },
    data: publicBlockData(block),
    style: pick(block.style, STYLE_FIELDS),
    accessibility: pick(block.accessibility, ['label', 'description', 'decorative']),
  });
}

export function createPublicProfileProjectionV2(
  profile,
  { tracks = [], assets = [] } = {},
) {
  const canonical = profileDocumentV2Schema.parse(profile);
  if (canonical.status !== 'published') throw new Error('Only a published profile can produce a public projection.');
  const allowedTrackIds = new Set(canonical.music.trackIds);
  const allowedAssetIds = new Set(canonical.mediaAssetIds);
  const parsedTracks = tracks.map((track) => musicTrackV2Schema.parse(track));
  const parsedAssets = assets.map((asset) => mediaAssetV2Schema.parse(asset));
  const suppliedTrackIds = new Set(parsedTracks.map((track) => track.id));
  const suppliedAssetIds = new Set(parsedAssets.map((asset) => asset.id));
  for (const trackId of allowedTrackIds) {
    if (!suppliedTrackIds.has(trackId)) throw new Error(`Missing referenced track: ${trackId}`);
  }
  for (const assetId of allowedAssetIds) {
    if (!suppliedAssetIds.has(assetId)) throw new Error(`Missing referenced asset: ${assetId}`);
  }
  for (const track of parsedTracks.filter((item) => allowedTrackIds.has(item.id))) {
    if (track.ownerUid !== canonical.ownerUid) throw new Error('A public profile cannot reference another owner\'s track.');
  }
  for (const asset of parsedAssets.filter((item) => allowedAssetIds.has(item.id))) {
    if (asset.ownerUid !== canonical.ownerUid) throw new Error('A public profile cannot reference another owner\'s asset.');
  }
  const publicTracks = parsedTracks
    .filter((track) => allowedTrackIds.has(track.id))
    .map((track) => ({
      id: track.id,
      source: pick(track.source, ['type', 'url', 'provider', 'embedUrl']),
      title: track.title,
      artist: track.artist,
      album: track.album,
      artworkUrl: track.artworkUrl,
      durationMs: track.durationMs,
      lyricsDocumentId: track.lyricsDocumentId,
    }));
  const publicAssets = parsedAssets
    .filter((asset) => allowedAssetIds.has(asset.id) && asset.lifecycle === 'active')
    .map((asset) => pick(asset, ['id', 'kind', 'url', 'mimeType', 'width', 'height', 'durationMs']));

  return publicProfileProjectionV2Schema.parse({
    schemaVersion: UPET_PROFILE_SCHEMA_VERSION,
    username: canonical.username,
    revision: canonical.revision,
    identity: pick(canonical.identity, ['displayName', 'handle', 'bio', 'location', 'avatarUrl', 'bannerUrl', 'badges']),
    pages: canonical.pages
      .filter((page) => page.visible)
      .map((page) => ({
        id: page.id,
        slug: page.slug,
        title: page.title,
        order: page.order,
        showInNavigation: page.showInNavigation,
        blocks: page.blocks.map(publicBlock).filter(Boolean),
      })),
    theme: publicTheme(canonical.theme),
    seo: pick(canonical.seo, ['title', 'description', 'imageAssetId']),
    music: { defaultTrackId: canonical.music.defaultTrackId, tracks: publicTracks },
    media: publicAssets,
    updatedAtMs: canonical.updatedAtMs,
  });
}

export function createDirectoryProfileProjectionV2(publicProfile, { shopEnabled = false } = {}) {
  const profile = publicProfileProjectionV2Schema.parse(publicProfile);
  const colors = isRecord(profile.theme.colors) ? profile.theme.colors : {};
  return directoryProfileProjectionV2Schema.parse({
    schemaVersion: UPET_PROFILE_SCHEMA_VERSION,
    username: profile.username,
    revision: profile.revision,
    displayName: profile.identity.displayName,
    bio: profile.identity.bio.slice(0, 280),
    avatarUrl: profile.identity.avatarUrl,
    badges: profile.identity.badges.slice(0, 20),
    accent: typeof colors.accent === 'string' ? colors.accent.slice(0, 64) : '',
    shopEnabled: Boolean(shopEnabled),
    updatedAtMs: profile.updatedAtMs,
  });
}
