import { migrateProfile, toRendererProfile } from '../../shared/profileSchema.js';
import { profileName } from '../../shared/profileIdentity.js';
import { BADGE_ORDER, OFFICIAL_BADGES, orderBadges } from './profileGrants.js';
import { sanitizeMusicEmbed } from '../../shared/musicEmbeds.js';

const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

const text = (value, max = 160) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
const oneOf = (value, options, fallback) => options.includes(value) ? value : fallback;
const assetUrl = (value) => {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url.slice(0, 2048);
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.toString().slice(0, 2048) : '';
  } catch {
    return '';
  }
};
const externalUrl = (value) => {
  const url = assetUrl(value);
  return /^https?:\/\//i.test(url) ? url : '';
};

const media = () => ({ src: '', type: '', zoom: 1, blur: 0, rotate: 0, size: 100, x: 50, y: 50 });

const mediaType = (source = {}) => {
  if (source.type === 'video' || String(source.type || '').startsWith('video/')) return 'video';
  if (source.type === 'image' || String(source.type || '').startsWith('image/')) return 'image';
  return /\.(mp4|webm|mov)(?:$|[?#])/i.test(String(source.src || '')) ? 'video' : source.src ? 'image' : '';
};

// Founder badges are granted by the public username so public profile reads can
// render them without exposing account emails or requiring a private user read.
const SYSTEM_BADGES = {
  lamp: BADGE_ORDER,
  dome: BADGE_ORDER,
};

export const defaultProfile = (username = '') => ({
  username,
  alias: username,
  displayName: username,
  bio: '',
  location: '',
  views: 0,
  viewHistory: [],
  badges: [],
  shownBadges: [],
  badgeOrder: [],
  media: { avatar: media(), banner: media(), background: media(), cursor: media() },
  effects: { text: 'none', textColor: '#6cc4ff', background: 'none', backgroundAmount: 50, backgroundColor: '#ffffff', overlay: 'none', decoration: null, decoHue: 0, decoSize: 120 },
  entry: { mode: 'button', title: 'click to enter', subtitle: '', textEffect: 'none', passwordSalt: '', passwordHash: '' },
  card: { layout: 'minimal', alpha: 0.6, radius: 24, width: 440, blur: 14, accent: '#6cc4ff', cardColor: '#0b1626', textColor: '#ffffff', bgColor: '#07111f', borderAlpha: 0.15, tilt: true },
  links: [],
  widgets: {
    discord: { enabled: false, userId: '', username: '', handle: '', avatar: '', banner: '', decoration: '', guildTag: '', guildBadge: '', publicFlags: 0, layout: 'compact', showBanner: true, showBadges: true, glow: 0, alpha: 0.5, radius: 16, accent: '#5865f2' },
    tiktok: { enabled: false, username: '', videoUrl: '', alpha: 0.5, radius: 16, accent: '#25f4ee' },
  },
  audio: { src: '', sourceType: 'upload', sourceUrl: '', embedUrl: '', embedProvider: '', title: '', artist: '', cover: '', autoplay: false, volume: 0.6, loop: true, playerPlacement: 'card', popupOnLoad: false, popupSide: 'left', playerBackground: '#000000', playerTextColor: '#ffffff', playerOpacity: 0.3, playerScale: 100, playerRadius: 12, playerBlur: 0, playerCoverSize: 36, playerEffect: 'none', playerShowProgress: false, playerProgressStyle: 'rounded', playerProgressHeight: 4, playerProgressColor: '#6cc4ff', playerProgressGlow: false, playerShowCover: true, playerShowArtist: true, playerBorder: true, expandedEnabled: false, expandedStyle: 'vinyl', expandedBackground: '#111319', expandedTextColor: '#ffffff', expandedOpacity: 0.98, expandedRadius: 30, expandedBlur: 16, expandedWidth: 512, expandedArtworkSize: 250, expandedEffect: 'none', expandedShowTimes: true, expandedShowSkip: true, expandedShowLyrics: true, lyrics: { enabled: false, lines: [], textEffect: 'none', alignment: 'center', display: 'player', textColor: '#b8c0cc', activeColor: '#ffffff', textSize: 42, panelStyle: 'clear', sideVertical: 'center', sideWidth: 420, sideInset: 4, sideTextSize: 56, popout: true } },
  tooltips: { enabled: true, style: 'glass', color: '#0b1626', textColor: '#ffffff', position: 'top' },
  badgeStyle: { style: 'soft', bgAlpha: 0.15, size: 14, glow: 0, monochrome: false, color: '#6cc4ff' },
  shop: { enabled: false, private: true, name: '', description: '', contactUrl: '', currency: 'GBP', design: {}, products: [] },
  linkStyle: { mode: 'list', iconColor: 'brand', glow: 0.6, glowColor: '', size: 18, radius: 12 },
  integrations: {},
});

const cleanMedia = (source = {}) => ({
  src: assetUrl(source.src),
  type: mediaType(source),
  zoom: clamp(source.zoom, 0.25, 4, 1),
  blur: clamp(source.blur, 0, 40, 0),
  rotate: clamp(source.rotate, -180, 180, 0),
  size: clamp(source.size, 24, 300, 100),
  x: clamp(source.x, 0, 100, 50),
  y: clamp(source.y, 0, 100, 50),
});

export function sanitizeRedesignProfile(source = {}, username = '') {
  const fallback = defaultProfile(username);
  const normalizedUsername = text(username || source.username, 20).toLowerCase();
  const links = Array.isArray(source.links) ? source.links.slice(0, 40).map((item, index) => ({
    id: text(item?.id || `link-${index}`, 80),
    label: text(item?.label, 80),
    url: externalUrl(item?.url),
    platform: text(item?.platform || 'website', 32).toLowerCase(),
  })).filter((item) => item.url) : [];
  const lyricLines = Array.isArray(source.audio?.lyrics?.lines) ? source.audio.lyrics.lines.slice(0, 150).map((line, index) => ({
    id: text(line?.id || `lyric-${index}`, 80),
    time: clamp(line?.time, 0, 86_400, 0),
    endTime: line?.endTime === null || line?.endTime === undefined || line?.endTime === '' || Number(line.endTime) <= Number(line.time) ? null : clamp(line.endTime, 0, 86_400, 0),
    synced: line?.synced === undefined ? true : Boolean(line.synced),
    text: text(line?.text, 240),
  })).filter((line) => line.text) : [];
  const musicEmbed = sanitizeMusicEmbed(source.audio);
  const sourceType = source.audio?.sourceType === 'embed' && musicEmbed.embedUrl ? 'embed' : 'upload';
  const savedBadges = Array.isArray(source.badges) ? source.badges.slice(0, 20).map((item) => text(item, 32)).filter((id) => !OFFICIAL_BADGES.has(id)) : [];
  const grants = SYSTEM_BADGES[normalizedUsername] || [];
  const preferredBadgeOrder = Array.isArray(source.badgeOrder)
    ? [...new Set(source.badgeOrder.slice(0, BADGE_ORDER.length).map((item) => text(item, 32)).filter((item) => BADGE_ORDER.includes(item) || savedBadges.includes(item)))]
    : [];
  const badges = orderBadges([...savedBadges, ...grants], preferredBadgeOrder);
  const savedShown = Array.isArray(source.shownBadges) ? source.shownBadges.slice(0, BADGE_ORDER.length).map((item) => text(item, 32)).filter((item) => badges.includes(item)) : [];
  const hasVisibilityPreferences = Array.isArray(source.hiddenBadges);
  const hiddenBadges = hasVisibilityPreferences
    ? [...new Set(source.hiddenBadges.map((item) => text(item, 32)).filter((item) => OFFICIAL_BADGES.has(item)))]
    : undefined;
  const migratedShown = grants.length ? [...new Set([...savedShown, ...grants])] : savedShown;
  const shownBadges = hasVisibilityPreferences
    ? badges.filter((item) => !hiddenBadges.includes(item))
    : orderBadges(migratedShown, preferredBadgeOrder).slice(0, BADGE_ORDER.length);
  const integrations = {};
  for (const provider of ['discord', 'spotify', 'tiktok', 'github']) {
    const entry = source.integrations?.[provider];
    if (entry && typeof entry === 'object') integrations[provider] = provider === 'discord'
      ? { id: text(entry.id, 32), username: text(entry.username, 80), handle: text(entry.handle, 80), avatar: assetUrl(entry.avatar), banner: assetUrl(entry.banner), decoration: assetUrl(entry.decoration), guildTag: text(entry.guildTag, 4), guildBadge: assetUrl(entry.guildBadge), publicFlags: clamp(entry.publicFlags, 0, 0x7fffffff, 0), accentColor: color(entry.accentColor, ''), fetchedAt: clamp(entry.fetchedAt, 0, Number.MAX_SAFE_INTEGER, 0) }
      : { id: text(entry.id, 80), username: text(entry.username, 80), handle: text(entry.handle, 80), avatar: assetUrl(entry.avatar) };
  }

  const profile = {
    username: normalizedUsername,
    alias: text(profileName(source.alias, normalizedUsername) || fallback.alias, 40),
    displayName: text(profileName(source.displayName, normalizedUsername) || fallback.displayName, 40),
    bio: text(source.bio, 500),
    location: text(source.location, 80),
    views: clamp(source.views, 0, Number.MAX_SAFE_INTEGER, 0),
    viewHistory: Array.isArray(source.viewHistory) ? source.viewHistory.slice(-30).map((row) => ({ day: text(row?.day, 10), count: clamp(row?.count, 0, 1000000, 0) })) : [],
    badges,
    shownBadges,
    badgeOrder: preferredBadgeOrder.length ? preferredBadgeOrder : badges,
    ...(hasVisibilityPreferences ? { hiddenBadges } : {}),
    media: {
      avatar: cleanMedia(source.media?.avatar),
      banner: cleanMedia(source.media?.banner),
      background: cleanMedia(source.media?.background),
      cursor: cleanMedia(source.media?.cursor),
    },
    effects: {
      text: text(source.effects?.text || 'none', 32),
      textColor: color(source.effects?.textColor, source.card?.accent || '#6cc4ff'),
      background: text(source.effects?.background || 'none', 32),
      backgroundAmount: clamp(source.effects?.backgroundAmount, 0, 100, 50),
      backgroundColor: color(source.effects?.backgroundColor, '#ffffff'),
      overlay: text(source.effects?.overlay || 'none', 32),
      decoration: source.effects?.decoration ? {
        id: text(source.effects.decoration.id, 80),
        label: text(source.effects.decoration.label, 80),
        url: assetUrl(source.effects.decoration.url),
      } : null,
      decoHue: clamp(source.effects?.decoHue, 0, 360, 0),
      decoSize: clamp(source.effects?.decoSize, 50, 240, 120),
    },
    entry: {
      mode: oneOf(source.entry?.mode, ['button', 'anywhere', 'password'], 'button'),
      title: text(source.entry?.title ?? 'click to enter', 80),
      subtitle: text(source.entry?.subtitle, 160),
      textEffect: oneOf(source.entry?.textEffect, ['none', 'glitch', 'typewriter', 'flicker', 'rainbow', 'neon', 'wave', 'bounce', 'shake', 'gradient', 'blurin', 'scramble', 'rgb', 'outline', 'pulse', 'fire', 'ice', 'sparkle', 'float', 'chroma', '3d', 'swing', 'morph'], 'none'),
      passwordSalt: /^[a-f0-9]{32}$/i.test(source.entry?.passwordSalt || '') ? source.entry.passwordSalt : '',
      passwordHash: /^[a-f0-9]{64}$/i.test(source.entry?.passwordHash || '') ? source.entry.passwordHash : '',
    },
    card: {
      layout: oneOf(source.card?.layout, ['minimal', 'compact', 'banner', 'slideshow'], 'minimal'),
      alpha: clamp(source.card?.alpha, 0, 1, 0.6),
      radius: clamp(source.card?.radius, 0, 64, 24),
      width: clamp(source.card?.width, 280, 900, 440),
      blur: clamp(source.card?.blur, 0, 40, 14),
      accent: color(source.card?.accent, '#6cc4ff'),
      cardColor: color(source.card?.cardColor, '#0b1626'),
      textColor: color(source.card?.textColor, '#ffffff'),
      bgColor: color(source.card?.bgColor, '#07111f'),
      borderAlpha: clamp(source.card?.borderAlpha, 0, 1, 0.15),
      tilt: Boolean(source.card?.tilt),
    },
    links,
    widgets: {
      discord: {
        enabled: Boolean(source.widgets?.discord?.enabled),
        userId: text(source.widgets?.discord?.userId, 32),
        username: text(source.widgets?.discord?.username, 80),
        handle: text(source.widgets?.discord?.handle, 80),
        avatar: assetUrl(source.widgets?.discord?.avatar),
        banner: assetUrl(source.widgets?.discord?.banner),
        decoration: assetUrl(source.widgets?.discord?.decoration),
        guildTag: text(source.widgets?.discord?.guildTag, 4),
        guildBadge: assetUrl(source.widgets?.discord?.guildBadge),
        publicFlags: clamp(source.widgets?.discord?.publicFlags, 0, 0x7fffffff, 0),
        layout: oneOf(source.widgets?.discord?.layout, ['compact', 'expanded'], 'compact'),
        showBanner: source.widgets?.discord?.showBanner !== false,
        showBadges: source.widgets?.discord?.showBadges !== false,
        glow: clamp(source.widgets?.discord?.glow, 0, 1, 0),
        alpha: clamp(source.widgets?.discord?.alpha, 0, 1, 0.5),
        radius: clamp(source.widgets?.discord?.radius, 0, 40, 16),
        accent: color(source.widgets?.discord?.accent, '#5865f2'),
      },
      tiktok: {
        enabled: Boolean(source.widgets?.tiktok?.enabled),
        username: text(source.widgets?.tiktok?.username, 80),
        videoUrl: externalUrl(source.widgets?.tiktok?.videoUrl),
        alpha: clamp(source.widgets?.tiktok?.alpha, 0, 1, 0.5),
        radius: clamp(source.widgets?.tiktok?.radius, 0, 40, 16),
        accent: color(source.widgets?.tiktok?.accent, '#25f4ee'),
      },
    },
    audio: {
      src: sourceType === 'upload' ? assetUrl(source.audio?.src) : '',
      sourceType,
      sourceUrl: sourceType === 'embed' ? musicEmbed.sourceUrl : '',
      embedUrl: sourceType === 'embed' ? musicEmbed.embedUrl : '',
      embedProvider: sourceType === 'embed' ? musicEmbed.provider : '',
      title: text(source.audio?.title, 100),
      artist: text(source.audio?.artist, 100),
      cover: assetUrl(source.audio?.cover),
      autoplay: Boolean(source.audio?.autoplay),
      volume: clamp(source.audio?.volume, 0, 1, 0.6),
      loop: source.audio?.loop !== false,
      playerPlacement: oneOf(source.audio?.playerPlacement, ['card', 'left', 'right', 'button'], 'card'),
      popupOnLoad: Boolean(source.audio?.popupOnLoad),
      popupSide: oneOf(source.audio?.popupSide, ['left', 'right'], 'left'),
      playerBackground: color(source.audio?.playerBackground, '#000000'),
      playerTextColor: color(source.audio?.playerTextColor, '#ffffff'),
      playerOpacity: clamp(source.audio?.playerOpacity, 0, 1, 0.3),
      playerScale: clamp(source.audio?.playerScale, 70, 140, 100),
      playerRadius: clamp(source.audio?.playerRadius, 0, 40, 12),
      playerBlur: clamp(source.audio?.playerBlur, 0, 24, 0),
      playerCoverSize: clamp(source.audio?.playerCoverSize, 24, 72, 36),
      playerEffect: oneOf(source.audio?.playerEffect, ['none', 'glow', 'glass', 'gradient', 'scanlines'], 'none'),
      playerShowProgress: Boolean(source.audio?.playerShowProgress),
      playerProgressStyle: oneOf(source.audio?.playerProgressStyle, ['line', 'rounded', 'glow'], 'rounded'),
      playerProgressHeight: clamp(source.audio?.playerProgressHeight, 2, 10, 4),
      playerProgressColor: color(source.audio?.playerProgressColor, '#6cc4ff'),
      playerProgressGlow: Boolean(source.audio?.playerProgressGlow),
      playerShowCover: source.audio?.playerShowCover !== false,
      playerShowArtist: source.audio?.playerShowArtist !== false,
      playerBorder: source.audio?.playerBorder !== false,
      expandedEnabled: Boolean(source.audio?.expandedEnabled),
      expandedStyle: oneOf(source.audio?.expandedStyle, ['vinyl', 'artwork', 'minimal'], 'vinyl'),
      expandedBackground: color(source.audio?.expandedBackground, '#111319'),
      expandedTextColor: color(source.audio?.expandedTextColor, '#ffffff'),
      expandedOpacity: clamp(source.audio?.expandedOpacity, 0.35, 1, 0.98),
      expandedRadius: clamp(source.audio?.expandedRadius, 0, 48, 30),
      expandedBlur: clamp(source.audio?.expandedBlur, 0, 30, 16),
      expandedWidth: clamp(source.audio?.expandedWidth, 360, 680, 512),
      expandedArtworkSize: clamp(source.audio?.expandedArtworkSize, 150, 330, 250),
      expandedEffect: oneOf(source.audio?.expandedEffect, ['none', 'glow', 'gradient', 'glass'], 'none'),
      expandedShowTimes: source.audio?.expandedShowTimes !== false,
      expandedShowSkip: source.audio?.expandedShowSkip !== false,
      expandedShowLyrics: source.audio?.expandedShowLyrics !== false,
      lyrics: {
        enabled: Boolean(source.audio?.lyrics?.enabled),
        lines: lyricLines,
        textEffect: oneOf(source.audio?.lyrics?.textEffect, ['none', 'glow', 'fade', 'gradient'], 'none'),
        alignment: oneOf(source.audio?.lyrics?.alignment, ['center', 'left', 'right'], 'center'),
        display: oneOf(source.audio?.lyrics?.display, ['left', 'right', 'player'], 'player'),
        textColor: color(source.audio?.lyrics?.textColor, '#b8c0cc'),
        activeColor: color(source.audio?.lyrics?.activeColor, '#ffffff'),
        textSize: clamp(source.audio?.lyrics?.textSize, 18, 72, 42),
        panelStyle: oneOf(source.audio?.lyrics?.panelStyle, ['glass', 'clear'], 'clear'),
        sideVertical: oneOf(source.audio?.lyrics?.sideVertical, ['top', 'center', 'bottom'], 'center'),
        sideWidth: clamp(source.audio?.lyrics?.sideWidth, 260, 560, 420),
        sideInset: clamp(source.audio?.lyrics?.sideInset, 2, 12, 4),
        sideTextSize: clamp(source.audio?.lyrics?.sideTextSize, 32, 96, 56),
        popout: source.audio?.lyrics?.popout !== false,
      },
    },
    tooltips: {
      enabled: source.tooltips?.enabled !== false,
      style: oneOf(source.tooltips?.style, ['glass', 'solid', 'minimal'], 'glass'),
      color: color(source.tooltips?.color, '#0b1626'),
      textColor: color(source.tooltips?.textColor, '#ffffff'),
      position: oneOf(source.tooltips?.position, ['top', 'bottom'], 'top'),
    },
    badgeStyle: {
      style: oneOf(source.badgeStyle?.style, ['soft', 'solid', 'outline', 'plain'], 'soft'),
      bgAlpha: clamp(source.badgeStyle?.bgAlpha, 0, 1, 0.15),
      size: clamp(source.badgeStyle?.size, 8, 40, 14),
      glow: clamp(source.badgeStyle?.glow, 0, 16, 0),
      monochrome: Boolean(source.badgeStyle?.monochrome),
      color: color(source.badgeStyle?.color, '#6cc4ff'),
    },
    // Preserve retired commerce metadata without loading a shop implementation.
    shop: source.shop && typeof source.shop === 'object' && !Array.isArray(source.shop)
      ? { ...source.shop }
      : { ...fallback.shop },
    linkStyle: {
      mode: oneOf(source.linkStyle?.mode, ['list', 'icons'], 'list'),
      iconColor: text(source.linkStyle?.iconColor || 'brand', 16),
      glow: clamp(source.linkStyle?.glow, 0, 2, 0.6),
      glowColor: source.linkStyle?.glowColor ? color(source.linkStyle.glowColor, '') : '',
      size: clamp(source.linkStyle?.size, 12, 48, 18),
      radius: clamp(source.linkStyle?.radius, 0, 40, 12),
    },
    integrations,
  };
  if (JSON.stringify(profile).length > 700_000) throw new Error('This profile is too large to save. Remove some products or media.');
  return profile;
}

export function redesignFromDocument(document, username) {
  if (document?.redesign) return sanitizeRedesignProfile(document.redesign, username);
  let source;
  try { source = toRendererProfile(document || { username }, { username }); }
  catch { source = {}; }
  return sanitizeRedesignProfile({
    username,
    alias: source.displayName || username,
    displayName: source.displayName || username,
    bio: source.bio,
    location: source.location,
    badges: source.badges,
    shownBadges: source.badges,
    media: {
      avatar: { ...media(), src: source.avatarUrl, type: mediaType({ src: source.avatarUrl }), zoom: Number(source.avatarZoom || 100) / 100, rotate: source.avatarRotation, x: source.avatarCropX, y: source.avatarCropY },
      banner: { ...media(), src: source.bannerUrl, type: mediaType({ src: source.bannerUrl }) },
      background: { ...media(), src: source.backgroundUrl, type: source.backgroundType === 'video' ? 'video' : mediaType({ src: source.backgroundUrl }), blur: source.backgroundBlur, x: source.backgroundPositionX, y: source.backgroundPositionY, zoom: Number(source.backgroundScale || 100) / 100 },
      cursor: { ...media(), src: source.cursorUrl },
    },
    effects: { text: source.usernameEffect, background: source.backgroundEffect, backgroundAmount: source.effectIntensity, backgroundColor: source.backgroundEffectColor || source.accentColor, overlay: source.overlayEffect, decoration: source.avatarDecoration ? { id: source.avatarDecoration, label: 'Decoration', url: source.avatarDecoration } : null },
    card: { layout: source.layout === 'canvas' ? 'slideshow' : source.layout === 'stack' ? 'banner' : source.layout === 'minimal' ? 'compact' : 'minimal', alpha: Number(source.surfaceOpacity || 82) / 100, radius: source.borderRadius, width: source.cardWidth, blur: source.surfaceBlur, accent: source.accentColor, cardColor: source.surfaceColor, textColor: source.textColor, bgColor: source.backgroundColor, borderAlpha: 0.15, tilt: source.enableTilt },
    links: (source.links || []).map((item, index) => ({ id: `link-${index}`, ...item, platform: 'website' })),
    audio: { src: source.audioUrl, title: source.trackTitle, artist: source.trackArtist, cover: source.audioTracks?.[0]?.cover, volume: Number(source.volume || 60) / 100, loop: source.audioLoop !== false },
  }, username);
}

export function documentFromRedesign(source, uid, username) {
  const redesign = sanitizeRedesignProfile(source, username);
  const layout = { minimal: 'focus', compact: 'minimal', banner: 'stack', slideshow: 'canvas' }[redesign.card.layout] || 'focus';
  const base = migrateProfile({
    uid,
    username,
    displayName: redesign.displayName,
    subtitle: redesign.alias !== redesign.displayName ? redesign.alias : '',
    bio: redesign.bio,
    location: redesign.location,
    avatarUrl: redesign.media.avatar.src,
    avatarZoom: redesign.media.avatar.zoom * 100,
    avatarCropX: redesign.media.avatar.x,
    avatarCropY: redesign.media.avatar.y,
    avatarRotation: redesign.media.avatar.rotate,
    bannerUrl: redesign.media.banner.src,
    backgroundUrl: redesign.media.background.src,
    backgroundType: redesign.media.background.src ? (redesign.media.background.type === 'video' ? 'video' : 'image') : 'color',
    backgroundColor: redesign.card.bgColor,
    backgroundBlur: redesign.media.background.blur,
    backgroundPositionX: redesign.media.background.x,
    backgroundPositionY: redesign.media.background.y,
    backgroundScale: redesign.media.background.zoom * 100,
    cursorUrl: redesign.media.cursor.src,
    customCursor: Boolean(redesign.media.cursor.src),
    audioUrl: redesign.audio.src,
    trackTitle: redesign.audio.title,
    trackArtist: redesign.audio.artist,
    volume: redesign.audio.volume * 100,
    audioLoop: redesign.audio.loop,
    accentColor: redesign.card.accent,
    textColor: redesign.card.textColor,
    surfaceColor: redesign.card.cardColor,
    surfaceOpacity: redesign.card.alpha * 100,
    surfaceBlur: redesign.card.blur,
    borderRadius: redesign.card.radius,
    cardWidth: redesign.card.width,
    layout,
    enableTilt: redesign.card.tilt,
    backgroundEffect: redesign.effects.background,
    effectIntensity: redesign.effects.backgroundAmount,
    backgroundEffectColor: redesign.effects.backgroundColor,
    usernameEffect: redesign.effects.text,
    overlayEffect: redesign.effects.overlay,
    links: redesign.links,
    badges: redesign.shownBadges,
  });
  return { ...base, redesign };
}
