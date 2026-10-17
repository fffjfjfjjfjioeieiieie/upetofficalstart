import { migrateProfile, toRendererProfile } from '../../shared/profileSchema.js';

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

const media = () => ({ src: '', zoom: 1, blur: 0, rotate: 0, size: 100, x: 50, y: 50 });

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
  media: { avatar: media(), banner: media(), background: media(), cursor: media() },
  effects: { text: 'none', background: 'none', overlay: 'none', decoration: null, decoHue: 0, decoSize: 120 },
  card: { layout: 'minimal', alpha: 0.6, radius: 24, width: 440, blur: 14, accent: '#6cc4ff', cardColor: '#0b1626', textColor: '#ffffff', bgColor: '#07111f', borderAlpha: 0.15, tilt: true },
  links: [],
  widgets: {
    discord: { enabled: false, userId: '', alpha: 0.5, radius: 16, accent: '#5865f2' },
    tiktok: { enabled: false, username: '', videoUrl: '', alpha: 0.5, radius: 16, accent: '#25f4ee' },
  },
  audio: { src: '', title: '', artist: '', cover: '', autoplay: false, volume: 0.6, loop: true },
  tooltips: { enabled: true, style: 'glass', color: '#0b1626', textColor: '#ffffff', position: 'top' },
  badgeStyle: { style: 'soft', bgAlpha: 0.15, size: 14, glow: 0, monochrome: false, color: '#6cc4ff' },
  shop: { enabled: false, name: '', description: '', currency: 'GBP', products: [] },
  linkStyle: { mode: 'list', iconColor: 'brand', glow: 0.6, glowColor: '', size: 18, radius: 12 },
  integrations: {},
});

const cleanMedia = (source = {}) => ({
  src: assetUrl(source.src),
  zoom: clamp(source.zoom, 0.25, 4, 1),
  blur: clamp(source.blur, 0, 40, 0),
  rotate: clamp(source.rotate, -180, 180, 0),
  size: clamp(source.size, 24, 300, 100),
  x: clamp(source.x, 0, 100, 50),
  y: clamp(source.y, 0, 100, 50),
});

export function sanitizeRedesignProfile(source = {}, username = '') {
  const fallback = defaultProfile(username);
  const links = Array.isArray(source.links) ? source.links.slice(0, 40).map((item, index) => ({
    id: text(item?.id || `link-${index}`, 80),
    label: text(item?.label, 80),
    url: externalUrl(item?.url),
    platform: text(item?.platform || 'website', 32).toLowerCase(),
  })).filter((item) => item.url) : [];
  const products = Array.isArray(source.shop?.products) ? source.shop.products.slice(0, 50).map((item, index) => ({
    id: text(item?.id || `product-${index}`, 80),
    name: text(item?.name, 100),
    price: text(item?.price, 20),
    image: assetUrl(item?.image),
    description: text(item?.description, 500),
    stock: text(item?.stock, 20),
    type: oneOf(item?.type, ['digital', 'physical', 'service'], 'digital'),
  })).filter((item) => item.name) : [];
  const badges = Array.isArray(source.badges) ? source.badges.slice(0, 20).map((item) => text(item, 32)) : [];
  const shownBadges = Array.isArray(source.shownBadges) ? source.shownBadges.slice(0, 6).map((item) => text(item, 32)).filter((item) => badges.includes(item)) : [];
  const integrations = {};
  for (const provider of ['discord', 'spotify', 'tiktok', 'github']) {
    const entry = source.integrations?.[provider];
    if (entry && typeof entry === 'object') integrations[provider] = { id: text(entry.id, 80), username: text(entry.username, 80) };
  }

  const profile = {
    username: text(username || source.username, 20).toLowerCase(),
    alias: text(source.alias || fallback.alias, 40),
    displayName: text(source.displayName || fallback.displayName, 40),
    bio: text(source.bio, 500),
    location: text(source.location, 80),
    views: clamp(source.views, 0, Number.MAX_SAFE_INTEGER, 0),
    viewHistory: Array.isArray(source.viewHistory) ? source.viewHistory.slice(-30).map((row) => ({ day: text(row?.day, 10), count: clamp(row?.count, 0, 1000000, 0) })) : [],
    badges,
    shownBadges,
    media: {
      avatar: cleanMedia(source.media?.avatar),
      banner: cleanMedia(source.media?.banner),
      background: cleanMedia(source.media?.background),
      cursor: cleanMedia(source.media?.cursor),
    },
    effects: {
      text: text(source.effects?.text || 'none', 32),
      background: text(source.effects?.background || 'none', 32),
      overlay: text(source.effects?.overlay || 'none', 32),
      decoration: source.effects?.decoration ? {
        id: text(source.effects.decoration.id, 80),
        label: text(source.effects.decoration.label, 80),
        url: assetUrl(source.effects.decoration.url),
      } : null,
      decoHue: clamp(source.effects?.decoHue, 0, 360, 0),
      decoSize: clamp(source.effects?.decoSize, 50, 240, 120),
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
      src: assetUrl(source.audio?.src),
      title: text(source.audio?.title, 100),
      artist: text(source.audio?.artist, 100),
      cover: assetUrl(source.audio?.cover),
      autoplay: Boolean(source.audio?.autoplay),
      volume: clamp(source.audio?.volume, 0, 1, 0.6),
      loop: source.audio?.loop !== false,
    },
    tooltips: {
      enabled: source.tooltips?.enabled !== false,
      style: oneOf(source.tooltips?.style, ['glass', 'solid', 'minimal'], 'glass'),
      color: color(source.tooltips?.color, '#0b1626'),
      textColor: color(source.tooltips?.textColor, '#ffffff'),
      position: oneOf(source.tooltips?.position, ['top', 'bottom'], 'top'),
    },
    badgeStyle: {
      style: oneOf(source.badgeStyle?.style, ['soft', 'solid', 'outline'], 'soft'),
      bgAlpha: clamp(source.badgeStyle?.bgAlpha, 0, 1, 0.15),
      size: clamp(source.badgeStyle?.size, 8, 40, 14),
      glow: clamp(source.badgeStyle?.glow, 0, 2, 0),
      monochrome: Boolean(source.badgeStyle?.monochrome),
      color: color(source.badgeStyle?.color, '#6cc4ff'),
    },
    shop: {
      enabled: Boolean(source.shop?.enabled),
      name: text(source.shop?.name, 100),
      description: text(source.shop?.description, 500),
      currency: oneOf(source.shop?.currency, ['USD', 'EUR', 'GBP'], 'GBP'),
      products,
    },
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
  try { source = toRendererProfile(document || {}, { username }); }
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
      avatar: { ...media(), src: source.avatarUrl, zoom: Number(source.avatarZoom || 100) / 100, rotate: source.avatarRotation, x: source.avatarCropX, y: source.avatarCropY },
      banner: { ...media(), src: source.bannerUrl },
      background: { ...media(), src: source.backgroundUrl, blur: source.backgroundBlur, x: source.backgroundPositionX, y: source.backgroundPositionY, zoom: Number(source.backgroundScale || 100) / 100 },
      cursor: { ...media(), src: source.cursorUrl },
    },
    effects: { text: source.usernameEffect, background: source.backgroundEffect, overlay: source.overlayEffect, decoration: source.avatarDecoration ? { id: source.avatarDecoration, label: 'Decoration', url: source.avatarDecoration } : null },
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
    backgroundType: redesign.media.background.src ? 'image' : 'color',
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
    usernameEffect: redesign.effects.text,
    overlayEffect: redesign.effects.overlay,
    links: redesign.links,
    badges: redesign.shownBadges,
  });
  return { ...base, redesign };
}
