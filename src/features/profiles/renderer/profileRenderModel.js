import { profileDocumentV2Schema } from '../../../shared/contracts/profileV2.js';
import { publicProfileProjectionV2Schema } from '../../../shared/contracts/publicProfileV2.js';

const SUPPORTED_BLOCK_TYPES = new Set(['heading', 'text', 'divider']);

// A legacy document stays on the proven v1 renderer until its individual blocks
// have parity. Never coerce a private canonical document into a public response.
export function resolveProfileRenderSource(source, { audience = 'public' } = {}) {
  if (!source || typeof source !== 'object') throw new TypeError('A profile document is required.');
  if (source.schemaVersion == null || source.schemaVersion === 0 || source.schemaVersion === 1) return { kind: 'legacy', source };
  if (source.schemaVersion !== 2) throw new TypeError('Unsupported profile schema version.');
  if (audience === 'public') return { kind: 'v2', profile: publicProfileProjectionV2Schema.parse(source) };
  if (audience === 'owner') return { kind: 'v2', profile: profileDocumentV2Schema.parse(source) };
  throw new TypeError('Unknown profile audience.');
}

export function getRenderablePage(profile, pageIdOrSlug = '', audience = 'public') {
  const pages = profile.pages.slice().sort((a, b) => a.order - b.order);
  const page = pages.find((item) => item.id === pageIdOrSlug || item.slug === pageIdOrSlug) || (!pageIdOrSlug ? pages[0] : null);
  if (!page || (audience === 'public' && page.visible === false)) return null;
  return {
    ...page,
    blocks: page.blocks
      .filter((block) => block.visible !== false)
      .slice()
      .sort((a, b) => a.order - b.order),
  };
}

export function isRenderableBlockType(type) {
  return SUPPORTED_BLOCK_TYPES.has(type);
}

export function getBlockLayout(block, viewport = 'desktop') {
  return viewport === 'mobile' ? block.layout.mobile || block.layout.desktop : block.layout.desktop;
}

export function getBlockRenderStyle(block, viewport = 'desktop') {
  const layout = getBlockLayout(block, viewport);
  return {
    left: `${layout.x}%`,
    top: layout.y,
    width: `${Math.max(0, Math.min(layout.width, 100 - layout.x))}%`,
    minHeight: Math.max(38, layout.height),
    transform: `rotate(${layout.rotation}deg)`,
  };
}
