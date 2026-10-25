import {
  legacyProfileMigrationBundleSchema,
  lyricsDocumentV2Schema,
  profileDocumentV2Schema,
  UPET_LYRICS_SCHEMA_VERSION,
  UPET_MUSIC_SCHEMA_VERSION,
  UPET_PROFILE_SCHEMA_VERSION,
} from './profileV2.js';

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const clone = (value) => globalThis.structuredClone
  ? globalThis.structuredClone(value)
  : JSON.parse(JSON.stringify(value));
const cleanText = (value, maximum = 160) => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f]/g, '')
  .slice(0, maximum);
const finiteInteger = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : fallback;
};
const finiteSignedInteger = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
};
const safeUrl = (value) => cleanText(value, 2048);
const safeId = (value, fallback) => {
  const normalized = cleanText(value, 120).replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || fallback;
};
const normalizeUsername = (value) => {
  const normalized = cleanText(value, 32).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return /^[a-z0-9]/.test(normalized) ? normalized : 'user';
};
const legacyLayout = (order) => ({
  desktop: { x: 0, y: order * 12, width: 100, height: 0, rotation: 0 },
});

function legacyContext(source) {
  if (!isRecord(source)) throw new TypeError('A legacy profile document must be an object.');
  const isEnvelope = isRecord(source.published);
  const payload = isEnvelope ? source.published : source;
  const redesign = isRecord(payload.redesign)
    ? payload.redesign
    : isRecord(source.redesign)
      ? source.redesign
      : null;
  const sourceKind = redesign
    ? 'legacy-redesign'
    : Number(payload.schemaVersion) === 1 && isRecord(payload.identity)
      ? 'legacy-v1'
      : 'legacy-flat';

  return { isEnvelope, payload, redesign, sourceKind };
}

function legacyIdentity(source, context) {
  const { payload, redesign } = context;
  const identity = isRecord(payload.identity) ? payload.identity : {};
  const username = normalizeUsername(
    source.username
      || payload.username
      || redesign?.username
      || identity.username,
  );
  const displayName = cleanText(
    redesign?.displayName
      || redesign?.alias
      || identity.displayName
      || payload.displayName
      || username,
    80,
  ) || username;
  const redesignMedia = isRecord(redesign?.media) ? redesign.media : {};

  return {
    username,
    displayName,
    identity: {
      displayName,
      handle: username,
      bio: cleanText(redesign?.bio ?? identity.bio ?? payload.bio, 2000),
      location: cleanText(redesign?.location ?? identity.location ?? payload.location, 160),
      avatarAssetId: '',
      avatarUrl: safeUrl(redesignMedia.avatar?.src ?? identity.avatar ?? payload.avatarUrl),
      bannerAssetId: '',
      bannerUrl: safeUrl(redesignMedia.banner?.src ?? identity.banner ?? payload.bannerUrl),
      badges: (redesign?.shownBadges || redesign?.badges || identity.badges || payload.badges || [])
        .slice(0, 100)
        .map((badge) => cleanText(badge, 64))
        .filter(Boolean),
    },
  };
}

function blockFromLegacy(block, order) {
  const source = isRecord(block) ? block : {};
  return {
    id: safeId(source.id, `legacy-block-${order}`),
    type: cleanText(source.type || 'legacy', 80) || 'legacy',
    order,
    visible: source.enabled !== false,
    layout: legacyLayout(order),
    data: isRecord(source.content) ? clone(source.content) : { legacyValue: clone(source.content) },
    style: isRecord(source.style) ? clone(source.style) : {},
    accessibility: { label: '', description: '', decorative: false },
    legacy: clone(source),
  };
}

function linkBlock(link, order) {
  const source = isRecord(link) ? link : {};
  return {
    id: safeId(source.id, `legacy-link-${order}`),
    type: 'link',
    order,
    visible: source.enabled !== false,
    layout: legacyLayout(order),
    data: {
      label: cleanText(source.label, 160),
      url: safeUrl(source.url),
      platform: cleanText(source.platform || 'website', 40),
      legacy: clone(source),
    },
    style: {},
    accessibility: { label: '', description: '', decorative: false },
  };
}

function legacyBlocks(context, identity) {
  const { payload, redesign } = context;
  const blocks = [{
    id: 'identity',
    type: 'identity',
    order: 0,
    visible: true,
    layout: legacyLayout(0),
    data: clone(identity),
    style: {},
    accessibility: { label: 'Profile identity', description: '', decorative: false },
  }];
  const sourceBlocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  if (sourceBlocks.length) {
    blocks.push(...sourceBlocks.slice(0, 79).map((block, index) => blockFromLegacy(block, index + 1)));
    return blocks;
  }

  const sourceLinks = Array.isArray(redesign?.links)
    ? redesign.links
    : Array.isArray(payload.links)
      ? payload.links
      : [];
  blocks.push(...sourceLinks.slice(0, 79).map((link, index) => linkBlock(link, index + 1)));
  return blocks;
}

function legacyAudioSources(context) {
  const { payload, redesign } = context;
  const audio = isRecord(redesign?.audio)
    ? redesign.audio
    : isRecord(payload.audio)
      ? payload.audio
      : {};
  if (Array.isArray(audio.tracks) && audio.tracks.length) {
    return audio.tracks.slice(0, 500).map((track) => ({ track: isRecord(track) ? track : {}, audio }));
  }

  const uploadUrl = redesign ? audio.src : payload.audioUrl;
  const embedUrl = audio.embedUrl;
  const sourceUrl = audio.sourceUrl;
  if (!uploadUrl && !embedUrl && !sourceUrl) return [];
  return [{
    track: {
      id: audio.id,
      title: audio.title || payload.trackTitle,
      artist: audio.artist || payload.trackArtist,
      cover: audio.cover,
      url: uploadUrl,
      sourceType: audio.sourceType,
      sourceUrl,
      embedUrl,
      embedProvider: audio.embedProvider,
      rightsConfirmed: audio.rightsConfirmed,
      lyrics: audio.lyrics,
    },
    audio,
  }];
}

function wordsFromLegacy(line, lineId) {
  if (!Array.isArray(line.words)) return [];
  return line.words.slice(0, 300).map((word, index) => {
    const startMs = finiteInteger(Number(word?.time ?? word?.startTime) * 1000, 0);
    const rawEnd = word?.endTime === null || word?.endTime === undefined
      ? null
      : finiteInteger(Number(word.endTime) * 1000, 0);
    return {
      id: safeId(word?.id, `${lineId}-word-${index}`),
      text: cleanText(word?.text, 120),
      startMs,
      endMs: rawEnd !== null && rawEnd > startMs ? rawEnd : null,
      legacy: isRecord(word) ? clone(word) : {},
    };
  });
}

export function lyricsFromLegacyLines(
  legacyLyrics = {},
  { ownerUid = '', trackId, documentId = `${trackId}-lyrics`, nowMs = Date.now() } = {},
) {
  const source = isRecord(legacyLyrics) ? legacyLyrics : {};
  const lines = Array.isArray(source.lines) ? source.lines.slice(0, 500) : [];
  const migratedLines = lines.map((lineValue, index) => {
    const line = isRecord(lineValue) ? lineValue : { text: lineValue };
    const lineId = safeId(line.id, `legacy-line-${index}`);
    const synced = line.synced !== false && Number.isFinite(Number(line.time));
    const startMs = synced ? finiteInteger(Number(line.time) * 1000, 0) : null;
    const rawEnd = line.endTime === null || line.endTime === undefined || !Number.isFinite(Number(line.endTime))
      ? null
      : finiteInteger(Number(line.endTime) * 1000, 0);
    return {
      id: lineId,
      text: cleanText(line.text, 500),
      startMs,
      endMs: startMs !== null && rawEnd !== null && rawEnd > startMs ? rawEnd : null,
      words: wordsFromLegacy(line, lineId),
      legacy: clone(line),
    };
  });
  const display = clone(source);
  delete display.lines;
  const hasWords = migratedLines.some((line) => line.words.length);
  const hasLines = migratedLines.some((line) => line.startMs !== null);

  return lyricsDocumentV2Schema.parse({
    schemaVersion: UPET_LYRICS_SCHEMA_VERSION,
    id: safeId(documentId, `${safeId(trackId, 'track')}-lyrics`),
    ownerUid,
    trackId: safeId(trackId, 'legacy-track-0'),
    revision: 0,
    timingMode: hasWords ? 'word' : hasLines ? 'line' : 'none',
    offsetMs: Math.min(3_600_000, Math.max(-3_600_000, finiteSignedInteger(source.offsetMs, 0))),
    language: cleanText(source.language, 32),
    stanzas: [{ id: 'legacy-stanza-0', order: 0, label: '', lines: migratedLines }],
    display,
    legacy: clone(source),
    updatedAtMs: nowMs,
  });
}

export function lyricsToLegacyLines(document) {
  const lyrics = lyricsDocumentV2Schema.parse(document);
  return lyrics.stanzas
    .slice()
    .sort((left, right) => left.order - right.order)
    .flatMap((stanza) => stanza.lines.map((line) => ({
      ...(isRecord(line.legacy) ? clone(line.legacy) : {}),
      id: line.id,
      text: line.text,
      time: line.startMs === null ? 0 : line.startMs / 1000,
      endTime: line.endMs === null ? null : line.endMs / 1000,
      synced: line.startMs !== null,
    })));
}

function migrateMusic(context, ownerUid, nowMs) {
  const sources = legacyAudioSources(context);
  const tracks = [];
  const lyrics = [];

  sources.forEach(({ track, audio }, index) => {
    const trackId = safeId(track.id, `legacy-track-${index}`);
    const lyricSource = isRecord(track.lyrics)
      ? track.lyrics
      : index === 0 && isRecord(audio.lyrics)
        ? audio.lyrics
        : null;
    const lyricsDocument = lyricSource
      ? lyricsFromLegacyLines(lyricSource, { ownerUid, trackId, documentId: `${trackId}-lyrics`, nowMs })
      : null;
    if (lyricsDocument) lyrics.push(lyricsDocument);
    const isEmbed = track.sourceType === 'embed' || Boolean(track.embedUrl);
    const url = isEmbed ? safeUrl(track.sourceUrl || track.url) : safeUrl(track.url);

    tracks.push({
      schemaVersion: UPET_MUSIC_SCHEMA_VERSION,
      id: trackId,
      ownerUid,
      source: {
        type: isEmbed ? 'embed' : context.sourceKind === 'legacy-v1' ? 'legacy' : 'upload',
        assetId: '',
        url,
        provider: cleanText(track.embedProvider, 40),
        embedUrl: isEmbed ? safeUrl(track.embedUrl) : '',
      },
      title: cleanText(track.title || 'Profile audio', 160),
      artist: cleanText(track.artist, 160),
      album: cleanText(track.album, 160),
      artworkAssetId: '',
      artworkUrl: safeUrl(track.cover),
      durationMs: Number.isFinite(Number(track.duration)) ? finiteInteger(Number(track.duration) * 1000, 0) : null,
      rightsConfirmed: Boolean(track.rightsConfirmed),
      lyricsDocumentId: lyricsDocument?.id || '',
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      legacy: clone(track),
    });
  });

  return { tracks, lyrics };
}

export function prepareLegacyProfileMigration(
  source,
  { ownerUid = '', username = '', nowMs = Date.now() } = {},
) {
  const snapshot = clone(source);
  const context = legacyContext(snapshot);
  const identityResult = legacyIdentity(snapshot, context);
  const resolvedOwnerUid = cleanText(ownerUid || snapshot.ownerUid || context.payload.ownerUid, 128);
  const resolvedUsername = normalizeUsername(username || identityResult.username);
  const blocks = legacyBlocks(context, identityResult.identity);
  const { tracks, lyrics } = migrateMusic(context, resolvedOwnerUid, nowMs);
  const payloadSeo = isRecord(context.payload.seo) ? context.payload.seo : {};
  const sourceSchemaVersion = finiteInteger(context.payload.schemaVersion ?? snapshot.schemaVersion, 0);
  const status = snapshot.status === 'archived' ? 'archived' : 'published';
  const theme = {
    legacy: clone(isRecord(context.payload.theme) ? context.payload.theme : {}),
    redesign: context.redesign ? clone({
      card: context.redesign.card,
      effects: context.redesign.effects,
      entry: context.redesign.entry,
      media: context.redesign.media,
      widgets: context.redesign.widgets,
      tooltips: context.redesign.tooltips,
      badgeStyle: context.redesign.badgeStyle,
      linkStyle: context.redesign.linkStyle,
    }) : {},
  };

  const profile = profileDocumentV2Schema.parse({
    schemaVersion: UPET_PROFILE_SCHEMA_VERSION,
    ownerUid: resolvedOwnerUid,
    username: resolvedUsername,
    revision: finiteInteger(snapshot.revision ?? snapshot.publishedRevision, 0),
    status,
    identity: { ...identityResult.identity, handle: resolvedUsername },
    pages: [{
      id: 'home',
      slug: '',
      title: 'Home',
      order: 0,
      visible: true,
      showInNavigation: true,
      blocks,
    }],
    theme,
    seo: {
      title: cleanText(payloadSeo.title ?? context.payload.seoTitle, 120),
      description: cleanText(payloadSeo.description ?? context.payload.seoDescription, 320),
      imageAssetId: '',
    },
    music: {
      trackIds: tracks.map((track) => track.id),
      playlistIds: [],
      defaultTrackId: tracks[0]?.id || '',
    },
    mediaAssetIds: [],
    compatibility: {
      source: context.sourceKind,
      sourceSchemaVersion,
      writeMode: 'blocked-until-roundtrip',
      legacySnapshot: snapshot,
    },
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
  });

  return legacyProfileMigrationBundleSchema.parse({
    profile,
    tracks,
    playlists: [],
    lyrics,
    assets: [],
  });
}

export function restoreLegacyProfileSource(profileOrBundle) {
  const profile = isRecord(profileOrBundle?.profile) ? profileOrBundle.profile : profileOrBundle;
  const parsed = profileDocumentV2Schema.parse(profile);
  if (parsed.compatibility.source === 'native-v2' || parsed.compatibility.legacySnapshot === undefined) {
    throw new Error('This v2 profile does not contain a restorable legacy snapshot.');
  }
  return clone(parsed.compatibility.legacySnapshot);
}

export function assertProfileDocumentV2Writable(profile) {
  const parsed = profileDocumentV2Schema.parse(profile);
  if (parsed.compatibility.writeMode !== 'enabled') {
    throw new Error('Legacy profile writes are blocked until lossless round-trip migration is explicitly enabled.');
  }
  return parsed;
}
