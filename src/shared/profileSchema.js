import { z } from 'zod';
import { createDefaultProfile } from './profileDefaults.js';
import { hasTemporaryAsset, plainText, safeAssetUrl, safeExternalUrl } from './profileSanitization.js';

export const PROFILE_SCHEMA_VERSION = 1;
export const BLOCK_TYPES = ['link', 'socials', 'heading', 'text', 'image', 'gallery', 'video', 'divider', 'music', 'featured', 'skills', 'project', 'quote', 'discordPresence', 'discordServer'];
export const LAYOUTS = ['focus', 'stack', 'minimal', 'canvas', 'portfolio'];

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const number = (min, max) => z.number().finite().min(min).max(max);
const string = (max) => z.string().max(max);
const link = string(2048);
export const blockSchema = z.object({
  id: string(80), type: z.enum(BLOCK_TYPES), enabled: z.boolean(), order: number(0, 1000),
  style: z.record(z.string(), z.unknown()), content: z.record(z.string(), z.unknown()),
});

export const profileDocumentSchema = z.object({
  schemaVersion: z.literal(PROFILE_SCHEMA_VERSION),
  identity: z.object({ displayName: string(32), subtitle: string(80), bio: string(500), location: string(64), timezone: string(64), avatar: link, banner: link, badges: z.array(string(32)).max(6), showViews: z.boolean(), showLocation: z.boolean(), showStatus: z.boolean(), statusText: string(48), showBanner: z.boolean() }),
  theme: z.object({
    layout: z.enum(LAYOUTS), alignment: z.enum(['left', 'center', 'right']), width: number(320, 1100), density: z.enum(['compact', 'comfortable', 'spacious']),
    colors: z.object({ accent: color, secondary: color, text: color, muted: color, surface: color, visualizer: color }),
    typography: z.object({ pageFont: string(32), displayFont: string(32), linkFont: string(32), displayWeight: number(300, 900), letterSpacing: number(-4, 8) }),
    surface: z.object({ enabled: z.boolean(), opacity: number(0, 100), blur: number(0, 40), radius: number(0, 48), borderColor: color, borderWidth: number(0, 6), shadow: z.boolean() }),
    avatar: z.object({ shape: z.enum(['circle', 'squircle', 'square']), size: number(64, 180), zoom: number(100, 200), cropX: number(0, 100), cropY: number(0, 100), rotation: number(-180, 180), decoration: string(64) }),
    buttons: z.object({ style: z.enum(['solid', 'outline', 'soft', 'glass', 'underline', 'icon']), radius: number(0, 40), background: color, text: color, border: color }),
  }),
  background: z.object({ type: z.enum(['color', 'gradient', 'image', 'video']), color, gradient: string(200), asset: link, fit: z.enum(['cover', 'contain']), positionX: number(0, 100), positionY: number(0, 100), blur: number(0, 40), brightness: number(0, 200), saturation: number(0, 200), overlay: color, overlayOpacity: number(0, 100) }),
  entrance: z.object({ enabled: z.boolean(), title: string(80), subtitle: string(120), icon: string(32), buttonLabel: string(48), transition: z.enum(['fade', 'scale', 'slide']) }),
  audio: z.object({ enabled: z.boolean(), tracks: z.array(z.object({ id: string(80), title: string(100), artist: string(100), url: link, cover: link })).max(20), activeTrackId: string(80), playerStyle: z.enum(['compact', 'full', 'minimal']), position: z.enum(['card', 'floating']), volume: number(0, 100), loop: z.boolean(), shuffle: z.boolean(), showVisualizer: z.boolean(), showVolumeControl: z.boolean(), visualizerIntensity: number(0, 100) }),
  effects: z.object({ background: string(40), displayName: string(40), username: string(40), bio: string(40), card: string(40), overlay: string(40), cursor: link, customCursor: z.boolean(), clickSound: link, clickSoundEnabled: z.boolean(), clickSoundVolume: number(0, 100).default(35), intensity: number(0, 100), enableTilt: z.boolean(), grain: z.boolean(), animatedAccent: z.boolean(), animatedTitle: z.boolean(), reducedMotionMode: z.boolean() }),
  blocks: z.array(blockSchema).max(80),
  seo: z.object({ title: string(70), description: string(160) }),
  safety: z.object({ contentWarning: string(160), ageGate: z.boolean() }),
});

const numeric = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const profileColor = (value, fallback) => /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : fallback;

export function migrateProfile(source = {}) {
  if (source?.schemaVersion === PROFILE_SCHEMA_VERSION && source.identity && source.theme) return profileDocumentSchema.parse(source);
  const flat = { ...createDefaultProfile({ uid: source.uid, username: source.username }), ...source };
  const blocks = Array.isArray(flat.blocks) && flat.blocks.length ? flat.blocks : (flat.links || []).map((item, index) => ({ id: `legacy-${index}`, type: 'link', enabled: true, order: index, style: {}, content: { label: plainText(item.label, 80), url: safeExternalUrl(item.url) } }));
  const tracks = Array.isArray(flat.audioTracks) && flat.audioTracks.length ? flat.audioTracks : flat.audioUrl ? [{ id: 'main', title: plainText(flat.trackTitle || 'Profile audio', 100), artist: plainText(flat.trackArtist, 100), url: safeAssetUrl(flat.audioUrl), cover: '' }] : [];
  return profileDocumentSchema.parse({
    schemaVersion: PROFILE_SCHEMA_VERSION,
    identity: { displayName: plainText(flat.displayName, 32), subtitle: plainText(flat.subtitle, 80), bio: plainText(flat.bio, 500), location: plainText(flat.location, 64), timezone: plainText(flat.timezone, 64), avatar: safeAssetUrl(flat.avatarUrl), banner: safeAssetUrl(flat.bannerUrl), badges: (flat.badges || []).slice(0, 6).map((badge) => plainText(badge, 32)), showViews: flat.showViews !== false, showLocation: flat.showLocation !== false, showStatus: flat.showStatus !== false, statusText: plainText(flat.statusText, 48), showBanner: Boolean(flat.showBanner) },
    theme: { layout: ({ centered: 'focus', spotlight: 'stack' })[flat.layout] || (LAYOUTS.includes(flat.layout) ? flat.layout : 'focus'), alignment: flat.alignment || 'center', width: numeric(flat.cardWidth, 480), density: flat.density || 'comfortable', colors: { accent: profileColor(flat.accentColor, '#28a8f6'), secondary: profileColor(flat.secondaryColor, '#a98bea'), text: profileColor(flat.textColor, '#f4f5f7'), muted: profileColor(flat.mutedColor, '#9ba3b3'), surface: profileColor(flat.surfaceColor, '#101218'), visualizer: profileColor(flat.visualizerColor, '#28a8f6') }, typography: { pageFont: flat.font || 'space', displayFont: flat.displayFont || flat.font || 'space', linkFont: flat.linkFont || flat.font || 'space', displayWeight: numeric(flat.displayWeight, 650), letterSpacing: numeric(flat.letterSpacing, 0) }, surface: { enabled: flat.surfaceEnabled !== false, opacity: numeric(flat.surfaceOpacity, 82), blur: numeric(flat.surfaceBlur, 18), radius: numeric(flat.borderRadius, 24), borderColor: profileColor(flat.borderColor, '#6b7892'), borderWidth: numeric(flat.borderWidth, 1), shadow: flat.surfaceShadow !== false }, avatar: { shape: flat.avatarShape || 'circle', size: numeric(flat.avatarSize, 116), zoom: numeric(flat.avatarZoom, 100), cropX: numeric(flat.avatarCropX, 50), cropY: numeric(flat.avatarCropY, 50), rotation: numeric(flat.avatarRotation, 0), decoration: flat.avatarDecoration || '' }, buttons: { style: flat.buttonStyle || 'soft', radius: numeric(flat.buttonRadius, 11), background: profileColor(flat.buttonBackground, '#162235'), text: profileColor(flat.buttonText, '#f7f8fc'), border: profileColor(flat.buttonBorder, '#3d4f6c') } },
    background: { type: flat.backgroundType === 'video' ? 'video' : flat.backgroundUrl ? 'image' : 'color', color: profileColor(flat.backgroundColor, '#080e1b'), gradient: flat.backgroundGradient || '', asset: safeAssetUrl(flat.backgroundUrl), fit: flat.backgroundFit || 'cover', positionX: numeric(flat.backgroundPositionX, 50), positionY: numeric(flat.backgroundPositionY, 50), blur: numeric(flat.backgroundBlur, 0), brightness: numeric(flat.backgroundBrightness, 100), saturation: numeric(flat.backgroundSaturation, 100), overlay: profileColor(flat.backgroundOverlay, '#05070b'), overlayOpacity: numeric(flat.backgroundOverlayOpacity, 60) },
    entrance: { enabled: Boolean(flat.showEnterScreen), title: plainText(flat.enterText, 80), subtitle: plainText(flat.enterSubtitle, 120), icon: plainText(flat.enterIcon, 32), buttonLabel: plainText(flat.enterButtonLabel || 'enter profile', 48), transition: flat.enterTransition || 'fade' },
    audio: { enabled: tracks.length > 0, tracks, activeTrackId: flat.activeTrackId || tracks[0]?.id || '', playerStyle: flat.playerStyle || 'compact', position: flat.playerPosition || 'card', volume: numeric(flat.volume, 72), loop: flat.audioLoop !== false, shuffle: Boolean(flat.audioShuffle), showVisualizer: flat.showVisualizer !== false, showVolumeControl: flat.showVolumeControl !== false, visualizerIntensity: numeric(flat.visualizerIntensity, 50) },
    effects: { background: flat.backgroundEffect || 'none', displayName: flat.usernameEffect || 'none', username: flat.usernameEffect || 'none', bio: flat.bioEffect || 'none', card: flat.cardEffect || 'none', overlay: flat.overlayEffect || 'none', cursor: safeAssetUrl(flat.cursorUrl), customCursor: Boolean(flat.customCursor), clickSound: safeAssetUrl(flat.clickSoundUrl), clickSoundEnabled: Boolean(flat.clickSoundEnabled), clickSoundVolume: numeric(flat.clickSoundVolume, 35), intensity: numeric(flat.effectIntensity, 50), enableTilt: Boolean(flat.enableTilt), grain: Boolean(flat.enableGrain), animatedAccent: Boolean(flat.animatedAccent), animatedTitle: Boolean(flat.animatedTitle), reducedMotionMode: Boolean(flat.reducedMotionMode) },
    blocks, seo: { title: plainText(flat.seoTitle, 70), description: plainText(flat.seoDescription, 160) }, safety: { contentWarning: plainText(flat.contentWarning, 160), ageGate: Boolean(flat.ageGate) },
  });
}

export function createProfileDocument({ uid = '', username = '' } = {}) {
  return migrateProfile(createDefaultProfile({ uid, username }));
}

export function validateProfileForSave(source) {
  if (hasTemporaryAsset(source)) throw new Error('An upload is still previewing. Wait for it to finish before saving.');
  return migrateProfile(source);
}

export function toRendererProfile(source, { uid = '', username = '' } = {}) {
  const doc = migrateProfile(source);
  const track = doc.audio.tracks.find((item) => item.id === doc.audio.activeTrackId) || doc.audio.tracks[0];
  return {
    ...createDefaultProfile({ uid, username }), uid, username, document: doc,
    displayName: doc.identity.displayName, subtitle: doc.identity.subtitle, bio: doc.identity.bio, location: doc.identity.location, timezone: doc.identity.timezone, avatarUrl: doc.identity.avatar, bannerUrl: doc.identity.banner, badges: doc.identity.badges, showViews: doc.identity.showViews, showLocation: doc.identity.showLocation, showStatus: doc.identity.showStatus, statusText: doc.identity.statusText, showBanner: doc.identity.showBanner,
    layout: doc.theme.layout, alignment: doc.theme.alignment, cardWidth: doc.theme.width, density: doc.theme.density, accentColor: doc.theme.colors.accent, secondaryColor: doc.theme.colors.secondary, textColor: doc.theme.colors.text, mutedColor: doc.theme.colors.muted, surfaceColor: doc.theme.colors.surface, visualizerColor: doc.theme.colors.visualizer,
    font: doc.theme.typography.pageFont, displayFont: doc.theme.typography.displayFont, linkFont: doc.theme.typography.linkFont, displayWeight: doc.theme.typography.displayWeight, letterSpacing: doc.theme.typography.letterSpacing, surfaceEnabled: doc.theme.surface.enabled, surfaceOpacity: doc.theme.surface.opacity, surfaceBlur: doc.theme.surface.blur, borderRadius: doc.theme.surface.radius, borderColor: doc.theme.surface.borderColor, borderWidth: doc.theme.surface.borderWidth, surfaceShadow: doc.theme.surface.shadow,
    avatarShape: doc.theme.avatar.shape, avatarSize: doc.theme.avatar.size, avatarZoom: doc.theme.avatar.zoom, avatarCropX: doc.theme.avatar.cropX, avatarCropY: doc.theme.avatar.cropY, avatarRotation: doc.theme.avatar.rotation, avatarDecoration: doc.theme.avatar.decoration, buttonStyle: doc.theme.buttons.style, buttonRadius: doc.theme.buttons.radius, buttonBackground: doc.theme.buttons.background, buttonText: doc.theme.buttons.text, buttonBorder: doc.theme.buttons.border,
    backgroundType: doc.background.type, backgroundColor: doc.background.color, backgroundGradient: doc.background.gradient, backgroundUrl: doc.background.asset, backgroundFit: doc.background.fit, backgroundPositionX: doc.background.positionX, backgroundPositionY: doc.background.positionY, backgroundBlur: doc.background.blur, backgroundBrightness: doc.background.brightness, backgroundSaturation: doc.background.saturation, backgroundOverlay: doc.background.overlay, backgroundOverlayOpacity: doc.background.overlayOpacity,
    showEnterScreen: doc.entrance.enabled, enterText: doc.entrance.title, enterSubtitle: doc.entrance.subtitle, enterIcon: doc.entrance.icon, enterButtonLabel: doc.entrance.buttonLabel, enterTransition: doc.entrance.transition, audioUrl: track?.url || '', trackTitle: track?.title || '', trackArtist: track?.artist || '', audioTracks: doc.audio.tracks, activeTrackId: doc.audio.activeTrackId, playerStyle: doc.audio.playerStyle, playerPosition: doc.audio.position, volume: doc.audio.volume, audioLoop: doc.audio.loop, audioShuffle: doc.audio.shuffle, showVisualizer: doc.audio.showVisualizer, showVolumeControl: doc.audio.showVolumeControl, visualizerIntensity: doc.audio.visualizerIntensity,
    backgroundEffect: doc.effects.background, usernameEffect: doc.effects.displayName, bioEffect: doc.effects.bio, cardEffect: doc.effects.card, overlayEffect: doc.effects.overlay, cursorUrl: doc.effects.cursor, customCursor: doc.effects.customCursor, clickSoundUrl: doc.effects.clickSound, clickSoundEnabled: doc.effects.clickSoundEnabled, clickSoundVolume: doc.effects.clickSoundVolume, effectIntensity: doc.effects.intensity, enableTilt: doc.effects.enableTilt, enableGrain: doc.effects.grain, animatedAccent: doc.effects.animatedAccent, animatedTitle: doc.effects.animatedTitle, reducedMotionMode: doc.effects.reducedMotionMode, blocks: doc.blocks,
    links: doc.blocks.filter((block) => block.enabled && block.type === 'link').map((block) => ({ label: block.content.label || '', url: block.content.url || '' })), seoTitle: doc.seo.title, seoDescription: doc.seo.description, contentWarning: doc.safety.contentWarning, ageGate: doc.safety.ageGate,
  };
}
