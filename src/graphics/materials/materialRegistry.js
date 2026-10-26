import { z } from 'zod';

export const MATERIAL_VARIANTS = Object.freeze([
  { id: 'matte', label: 'Midnight matte' },
  { id: 'crystal', label: 'Crystal glass' },
  { id: 'frosted', label: 'Frosted glass' },
  { id: 'smoked-glass', label: 'Smoked glass' },
  { id: 'tinted-glass', label: 'Tinted glass' },
  { id: 'liquid-glass', label: 'Liquid glass (3D lens)' },
  { id: 'water', label: 'Water ripples' },
  { id: 'silk', label: 'Flowing silk' },
  { id: 'chrome', label: 'Polished chrome' },
  { id: 'brushed-steel', label: 'Brushed steel' },
  { id: 'gold', label: 'Gold' },
  { id: 'rose-gold', label: 'Rose gold' },
  { id: 'dark-metal', label: 'Dark metal' },
  { id: 'liquid-metal', label: 'Liquid metal' },
  { id: 'holographic', label: 'Holographic' },
]);

const validVariants = new Set(MATERIAL_VARIANTS.map((item) => item.id));
const metalVariants = ['chrome', 'brushed-steel', 'gold', 'rose-gold', 'dark-metal', 'liquid-metal'];
export const isMetalMaterial = (value) => metalVariants.includes(value);
const physicalVariants = [...metalVariants, 'holographic', 'liquid-glass', 'water', 'silk'];
export const isGpuMaterial = (value) => physicalVariants.includes(value);
const glassVariants = ['crystal', 'frosted', 'smoked-glass', 'tinted-glass'];
export const isGlassMaterial = (value) => glassVariants.includes(value);

export function normalizeMaterialVariant(value) {
  return validVariants.has(value) ? value : 'matte';
}

export const materialConfigSchema = z.object({
  id: z.enum(MATERIAL_VARIANTS.map((variant) => variant.id)).default('matte'),
  tint: z.string().regex(/^#[0-9a-f]{6}$/i).default('#a8c6dd'),
  radius: z.number().finite().min(0).max(48).default(26),
  blur: z.number().finite().min(0).max(40).default(15),
  opacity: z.number().finite().min(.35).max(.95).default(.75),
  edgeIntensity: z.number().finite().min(.1).max(1).default(.55),
  edgeWidth: z.number().finite().min(.5).max(4).default(1),
  edgeDepth: z.number().finite().min(0).max(12).default(4),
  grain: z.number().finite().min(0).max(1).default(.2),
  roughness: z.number().finite().min(.05).max(1).default(.2),
  reflection: z.number().finite().min(.1).max(2.5).default(1.2),
  lightAzimuth: z.number().finite().min(-180).max(180).default(-35),
  lightElevation: z.number().finite().min(10).max(80).default(45),
  brushStrength: z.number().finite().min(0).max(1).default(.5),
  brushDirection: z.number().finite().min(-180).max(180).default(0),
  waveAmplitude: z.number().finite().min(0).max(.12).default(.045),
  waveFrequency: z.number().finite().min(1).max(8).default(3),
  flowSpeed: z.number().finite().min(0).max(1).default(.2),
  iridescence: z.number().finite().min(0).max(1).default(.8),
  filmThickness: z.number().finite().min(100).max(1000).default(380),
  filmIOR: z.number().finite().min(1).max(2.5).default(1.3),
  shimmerSpeed: z.number().finite().min(0).max(.5).default(.08),
  lensCurvature: z.number().finite().min(0).max(1).default(.65),
  lensEdgeWidth: z.number().finite().min(.05).max(.6).default(.32),
  lensWaveStrength: z.number().finite().min(0).max(1).default(.2),
  lensWaveSpeed: z.number().finite().min(0).max(.5).default(.08),
  transmission: z.number().finite().min(.1).max(1).default(.95),
  ior: z.number().finite().min(1).max(2).default(1.45),
  thickness: z.number().finite().min(0).max(1).default(.45),
  dispersion: z.number().finite().min(0).max(1).default(.15),
  pointerIntensity: z.number().finite().min(0).max(1).default(.5),
  rippleRadius: z.number().finite().min(.05).max(.5).default(.2),
  rippleDamping: z.number().finite().min(.25).max(5).default(1.5),
  rippleSpeed: z.number().finite().min(.1).max(2).default(.7),
  sheen: z.number().finite().min(0).max(1).default(.8),
  sheenRoughness: z.number().finite().min(.2).max(1).default(.6),
  fabricAnisotropy: z.number().finite().min(0).max(1).default(.5),
  fabricGrain: z.number().finite().min(0).max(1).default(.25),
  fabricContrast: z.number().finite().min(0).max(1).default(.75),
});

export const MATERIAL_CONTROLS = Object.freeze([
  { key: 'tint', label: 'Tint', type: 'color' },
  { key: 'radius', label: 'Corner radius', min: 0, max: 48, step: 1, unit: 'px' },
  { key: 'edgeIntensity', label: 'Edge highlight', min: .1, max: 1, step: .05 },
  { key: 'edgeWidth', label: 'Edge width', min: .5, max: 4, step: .5, unit: 'px', variants: glassVariants },
  { key: 'edgeDepth', label: 'Edge depth', min: 0, max: 12, step: 1, unit: 'px', variants: glassVariants },
  { key: 'blur', label: 'Backdrop blur', min: 0, max: 40, step: 1, unit: 'px', variants: glassVariants },
  { key: 'opacity', label: 'Surface tint strength', min: .35, max: .95, step: .05, variants: glassVariants },
  { key: 'grain', label: 'Surface grain', min: 0, max: 1, step: .05, variants: ['frosted', 'smoked-glass', 'tinted-glass'] },
  { key: 'roughness', label: 'Roughness', min: .05, max: 1, step: .05, variants: physicalVariants },
  { key: 'reflection', label: 'Reflection brightness', min: .1, max: 2.5, step: .1, variants: physicalVariants },
  { key: 'lightAzimuth', label: 'Light direction', min: -180, max: 180, step: 5, unit: '°', variants: physicalVariants },
  { key: 'lightElevation', label: 'Light elevation', min: 10, max: 80, step: 5, unit: '°', variants: physicalVariants },
  { key: 'brushStrength', label: 'Brush strength', min: 0, max: 1, step: .05, variants: ['brushed-steel'] },
  { key: 'brushDirection', label: 'Brush direction', min: -180, max: 180, step: 5, unit: '°', variants: ['brushed-steel'] },
  { key: 'waveAmplitude', label: 'Wave depth', min: 0, max: .12, step: .005, variants: ['liquid-metal', 'water'] },
  { key: 'waveFrequency', label: 'Wave frequency', min: 1, max: 8, step: .25, variants: ['liquid-metal', 'water'] },
  { key: 'flowSpeed', label: 'Flow speed', min: 0, max: 1, step: .05, variants: ['liquid-metal', 'water', 'silk'] },
  { key: 'waveAmplitude', label: 'Fold depth', min: 0, max: .12, step: .005, variants: ['silk'] },
  { key: 'waveFrequency', label: 'Fold frequency', min: 1, max: 8, step: .25, variants: ['silk'] },
  { key: 'sheen', label: 'Fabric sheen', min: 0, max: 1, step: .05, variants: ['silk'] },
  { key: 'sheenRoughness', label: 'Sheen softness', min: .2, max: 1, step: .05, variants: ['silk'] },
  { key: 'fabricAnisotropy', label: 'Fibre directionality', min: 0, max: 1, step: .05, variants: ['silk'] },
  { key: 'fabricGrain', label: 'Fibre grain', min: 0, max: 1, step: .05, variants: ['silk'] },
  { key: 'fabricContrast', label: 'Fold contrast', min: 0, max: 1, step: .05, variants: ['silk'] },
  { key: 'iridescence', label: 'Iridescence intensity', min: 0, max: 1, step: .05, variants: ['holographic'] },
  { key: 'filmThickness', label: 'Film thickness', min: 100, max: 1000, step: 10, unit: 'nm', variants: ['holographic'] },
  { key: 'filmIOR', label: 'Film refractive index', min: 1, max: 2.5, step: .05, variants: ['holographic'] },
  { key: 'shimmerSpeed', label: 'Shimmer speed', min: 0, max: .5, step: .01, variants: ['holographic'] },
  { key: 'lensCurvature', label: 'Lens curvature', min: 0, max: 1, step: .05, variants: ['liquid-glass'] },
  { key: 'lensEdgeWidth', label: 'Lens rim width', min: .05, max: .6, step: .05, variants: ['liquid-glass'] },
  { key: 'lensWaveStrength', label: 'Lens liquid distortion', min: 0, max: 1, step: .05, variants: ['liquid-glass'] },
  { key: 'lensWaveSpeed', label: 'Lens liquid speed', min: 0, max: .5, step: .01, variants: ['liquid-glass'] },
  { key: 'transmission', label: 'Light transmission', min: .1, max: 1, step: .05, variants: ['liquid-glass', 'water'] },
  { key: 'ior', label: 'Refractive index', min: 1, max: 2, step: .05, variants: ['liquid-glass', 'water'] },
  { key: 'thickness', label: 'Optical thickness', min: 0, max: 1, step: .05, variants: ['liquid-glass', 'water'] },
  { key: 'dispersion', label: 'Colour dispersion', min: 0, max: 1, step: .05, variants: ['liquid-glass', 'water'] },
  { key: 'pointerIntensity', label: 'Pointer lens response', min: 0, max: 1, step: .05, variants: ['liquid-glass'] },
  { key: 'rippleRadius', label: 'Ripple spread', min: .05, max: .5, step: .05, variants: ['water'] },
  { key: 'rippleDamping', label: 'Ripple damping', min: .25, max: 5, step: .25, variants: ['water'] },
  { key: 'rippleSpeed', label: 'Ripple speed', min: .1, max: 2, step: .1, variants: ['water'] },
]);

export function createMaterialConfig(id = 'matte') {
  const presets = {
    chrome: { tint: '#c9d5df', roughness: .2 },
    'brushed-steel': { tint: '#a9b8c4', roughness: .4, reflection: 1.1, brushStrength: .65 },
    gold: { tint: '#e1ba65', roughness: .2, reflection: 1.3 },
    'rose-gold': { tint: '#d4a092', roughness: .25 },
    'dark-metal': { tint: '#4b5360', roughness: .3, reflection: 1.5 },
    'liquid-metal': { tint: '#c5d4df', roughness: .1, reflection: 1.5, waveAmplitude: .045, waveFrequency: 3, flowSpeed: .2 },
    holographic: { tint: '#66758a', roughness: .25, reflection: 1.1, iridescence: .9, filmThickness: 380, filmIOR: 1.4, shimmerSpeed: .08 },
    'liquid-glass': { tint: '#c4e5ed', roughness: .08, reflection: 1.1, lensCurvature: .65, transmission: .95, ior: 1.45, thickness: .45, dispersion: .15, pointerIntensity: .5 },
    water: { tint: '#76afc4', roughness: .12, reflection: 1.3, transmission: .85, ior: 1.33, thickness: .3, dispersion: .05, waveAmplitude: .025, waveFrequency: 3, flowSpeed: .25, rippleRadius: .2, rippleDamping: 1.5, rippleSpeed: .7 },
    silk: { tint: '#655486', roughness: .55, reflection: .6, waveAmplitude: .12, waveFrequency: 5, flowSpeed: .1, sheen: .8, sheenRoughness: .6, fabricAnisotropy: .5, fabricGrain: .25 },
    crystal: { blur: 12, opacity: .55, grain: 0, edgeIntensity: .65 },
    frosted: { blur: 28, opacity: .75, grain: .3 },
    'smoked-glass': { tint: '#59616c', blur: 10, opacity: .85, grain: .15, edgeIntensity: .35 },
    'tinted-glass': { tint: '#6886e3', blur: 18, opacity: .65, grain: .1, edgeIntensity: .65 },
  };
  return materialConfigSchema.parse({ id: normalizeMaterialVariant(id), ...presets[id] });
}

export function parseMaterialConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return materialConfigSchema.parse(value);
  return materialConfigSchema.parse({ ...createMaterialConfig(value.id), ...value });
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
    parseMaterialConfig(value);
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
