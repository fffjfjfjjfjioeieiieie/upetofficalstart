import { z } from 'zod';

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

export const materialConfigSchema = z.object({
  id: z.enum(['matte', 'crystal', 'frosted', 'chrome', 'holographic']).default('matte'),
  tint: z.string().regex(/^#[0-9a-f]{6}$/i).default('#a8c6dd'),
  radius: z.number().finite().min(0).max(48).default(26),
  blur: z.number().finite().min(0).max(40).default(15),
  opacity: z.number().finite().min(.35).max(.95).default(.75),
  edgeIntensity: z.number().finite().min(.1).max(1).default(.55),
  roughness: z.number().finite().min(.05).max(1).default(.2),
  reflection: z.number().finite().min(.1).max(2.5).default(1.2),
  lightAzimuth: z.number().finite().min(-180).max(180).default(-35),
  lightElevation: z.number().finite().min(10).max(80).default(45),
});

export const MATERIAL_CONTROLS = Object.freeze([
  { key: 'tint', label: 'Tint', type: 'color', variants: ['matte', 'crystal', 'frosted', 'chrome', 'holographic'] },
  { key: 'radius', label: 'Corner radius', min: 0, max: 48, step: 1, unit: 'px' },
  { key: 'edgeIntensity', label: 'Edge highlight', min: .1, max: 1, step: .05 },
  { key: 'blur', label: 'Backdrop blur', min: 0, max: 40, step: 1, unit: 'px', variants: ['crystal', 'frosted'] },
  { key: 'opacity', label: 'Surface tint strength', min: .35, max: .95, step: .05, variants: ['crystal', 'frosted'] },
  { key: 'roughness', label: 'Roughness', min: .05, max: 1, step: .05, variants: ['chrome'] },
  { key: 'reflection', label: 'Reflection brightness', min: .1, max: 2.5, step: .1, variants: ['chrome'] },
  { key: 'lightAzimuth', label: 'Light direction', min: -180, max: 180, step: 5, unit: '°', variants: ['chrome'] },
  { key: 'lightElevation', label: 'Light elevation', min: 10, max: 80, step: 5, unit: '°', variants: ['chrome'] },
]);

export function createMaterialConfig(id = 'matte') {
  return materialConfigSchema.parse({ id: normalizeMaterialVariant(id), ...(id === 'chrome' ? { tint: '#c9d5df' } : {}), ...(id === 'frosted' ? { blur: 28 } : {}) });
}

// Read paths degrade safely; trusted write paths use the rejecting schema below.
export function normalizeMaterialConfig(input) {
  const defaults = createMaterialConfig(input?.id);
  if (!input || typeof input !== 'object') return defaults;
  const safe = { ...defaults };
  for (const [key, value] of Object.entries(input)) {
    if (!Object.hasOwn(defaults, key) || key === 'id') continue;
    const result = materialConfigSchema.shape[key].safeParse(value);
    if (result.success) safe[key] = result.data;
  }
  return materialConfigSchema.parse(safe);
}

export function assertProfileMaterialConfigs(profile) {
  const check = (value) => {
    materialConfigSchema.parse(value);
    for (const key of ['shader', 'vertexShader', 'fragmentShader', 'glsl', 'script']) {
      if (Object.hasOwn(value, key)) throw new Error('Executable material settings are unsupported.');
    }
  };
  if (profile.theme?.material !== undefined) check(profile.theme.material);
  for (const page of profile.pages) for (const block of page.blocks) {
    if (block.style?.material !== undefined) check(block.style.material);
  }
  return profile;
}
