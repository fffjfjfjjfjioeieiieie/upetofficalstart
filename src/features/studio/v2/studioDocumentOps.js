import { profileDocumentV2Schema } from '../../../shared/contracts/profileV2.js';

export const STUDIO_BLOCK_TYPES = Object.freeze(['heading', 'text', 'divider']);

export function createStudioBlock(type, { id, order = 0 } = {}) {
  if (!STUDIO_BLOCK_TYPES.includes(type)) throw new Error(`Unsupported Studio block: ${type}`);
  const defaults = {
    heading: { text: 'A new heading', level: 2, subtitle: '' },
    text: { text: 'Write something meaningful.', markdown: false, alignment: 'left' },
    divider: { variant: 'line', label: '' },
  };
  return {
    id: id || globalThis.crypto.randomUUID(),
    type,
    order,
    visible: true,
    layout: { desktop: { x: 5, y: order * 70, width: 90, height: 60, rotation: 0 } },
    data: defaults[type],
    style: {},
    accessibility: { label: '', description: '', decorative: type === 'divider' },
  };
}

export function addStudioBlock(profile, pageId, type, id) {
  const page = profile.pages.find((item) => item.id === pageId);
  if (!page) throw new Error('Select a page before adding a block.');
  if (page.blocks.length >= 100) throw new Error('A page can contain at most 100 blocks.');
  const next = {
    ...profile,
    pages: profile.pages.map((item) => item.id === pageId
      ? { ...item, blocks: [...item.blocks, createStudioBlock(type, { id, order: item.blocks.length })] }
      : item),
  };
  return profileDocumentV2Schema.parse(next);
}

export function reorderStudioBlocks(profile, pageId, activeId, overId) {
  if (!activeId || !overId || activeId === overId) return profile;
  const page = profile.pages.find((item) => item.id === pageId);
  if (!page) throw new Error('The selected page was not found.');
  const ordered = page.blocks.slice().sort((a, b) => a.order - b.order);
  const from = ordered.findIndex((block) => block.id === activeId);
  const to = ordered.findIndex((block) => block.id === overId);
  if (from < 0 || to < 0) return profile;
  const [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);
  const blocks = ordered.map((block, order) => ({ ...block, order }));
  return profileDocumentV2Schema.parse({
    ...profile,
    pages: profile.pages.map((item) => item.id === pageId ? { ...item, blocks } : item),
  });
}

export function patchStudioBlockLayout(profile, pageId, blockId, viewport, field, rawValue) {
  if (!['desktop', 'mobile'].includes(viewport) || !['x', 'y', 'width', 'height', 'rotation'].includes(field)) {
    throw new Error('Unsupported responsive layout field.');
  }
  const value = Number(rawValue);
  if (!Number.isFinite(value)) throw new Error('Layout values must be finite numbers.');
  const bounds = { x: [0, 99], y: [0, 100_000], width: [1, 100], height: [0, 100_000], rotation: [-180, 180] };
  const [minimum, maximum] = bounds[field];
  const clamped = Math.max(minimum, Math.min(maximum, value));
  return profileDocumentV2Schema.parse({
    ...profile,
    pages: profile.pages.map((page) => page.id === pageId ? {
      ...page,
      blocks: page.blocks.map((block) => {
        if (block.id !== blockId) return block;
        const layout = { ...(block.layout[viewport] || block.layout.desktop), [field]: clamped };
        layout.width = Math.min(layout.width, 100 - layout.x);
        return { ...block, layout: { ...block.layout, [viewport]: layout } };
      }),
    } : page),
  });
}

export function createStudioHistory(present, limit = 50) {
  return { past: [], present, future: [], group: '', atMs: 0, limit };
}

export function commitStudioHistory(history, next, { group = '', atMs = Date.now() } = {}) {
  if (JSON.stringify(history.present) === JSON.stringify(next)) return history;
  const coalesce = group && group === history.group && atMs - history.atMs < 800;
  return {
    ...history,
    past: coalesce ? history.past : [...history.past, history.present].slice(-history.limit),
    present: next,
    future: [],
    group,
    atMs,
  };
}

export function undoStudioHistory(history) {
  if (!history.past.length) return history;
  return { ...history, past: history.past.slice(0, -1), present: history.past.at(-1), future: [history.present, ...history.future], group: '', atMs: 0 };
}

export function redoStudioHistory(history) {
  if (!history.future.length) return history;
  return { ...history, past: [...history.past, history.present].slice(-history.limit), present: history.future[0], future: history.future.slice(1), group: '', atMs: 0 };
}
