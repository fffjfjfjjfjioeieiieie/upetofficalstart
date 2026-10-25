export const MATERIAL_VARIANTS = Object.freeze([
  { id: 'matte', label: 'Midnight matte' },
  { id: 'crystal', label: 'Crystal glass' },
  { id: 'frosted', label: 'Frosted glass' },
  { id: 'chrome', label: 'Polished chrome' },
  { id: 'holographic', label: 'Holographic' },
]);

const validVariants = new Set(MATERIAL_VARIANTS.map((item) => item.id));

export function normalizeMaterialVariant(value) {
  return validVariants.has(value) ? value : 'matte';
}
