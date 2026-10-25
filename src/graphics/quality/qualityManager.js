export const GRAPHICS_TIERS = Object.freeze(['lite', 'balanced', 'high', 'ultra']);

export const GRAPHICS_BUDGETS = Object.freeze({
  lite: Object.freeze({ maxDpr: 1, particles: 0, shaderPasses: 0, animatedSurfaces: 0 }),
  balanced: Object.freeze({ maxDpr: 1.25, particles: 80, shaderPasses: 1, animatedSurfaces: 1 }),
  high: Object.freeze({ maxDpr: 1.75, particles: 300, shaderPasses: 2, animatedSurfaces: 2 }),
  ultra: Object.freeze({ maxDpr: 2, particles: 700, shaderPasses: 3, animatedSurfaces: 3 }),
});

const tierIndex = (tier) => GRAPHICS_TIERS.indexOf(tier);
const boundedTier = (tier) => tierIndex(tier) < 0 ? 'lite' : tier;

export function initialGraphicsTier({ saveData = false, deviceMemory, hardwareConcurrency, webglAvailable = true } = {}) {
  if (saveData || !webglAvailable) return 'lite';
  if (Number.isFinite(deviceMemory) && deviceMemory <= 2) return 'lite';
  if (Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 2) return 'balanced';
  if (Number.isFinite(deviceMemory) && deviceMemory >= 8 && Number.isFinite(hardwareConcurrency) && hardwareConcurrency >= 8) return 'high';
  return 'balanced';
}

export function boundedGraphicsDpr(tier, devicePixelRatio = 1) {
  const requested = Number(devicePixelRatio);
  return Math.max(1, Math.min(GRAPHICS_BUDGETS[boundedTier(tier)].maxDpr, Number.isFinite(requested) ? requested : 1));
}

export function createGraphicsQualityManager({
  initialTier = 'balanced',
  now = () => Date.now(),
  cooldownMs = 15_000,
  sampleSize = 60,
  slowFrameMs = 29,
  fastFrameMs = 16,
  maximumTier = 'ultra',
} = {}) {
  let tier = boundedTier(initialTier);
  let preference = 'auto';
  let visible = true;
  let reducedMotion = false;
  let contextAvailable = true;
  let lastChangeAt = -Infinity;
  let fastWindows = 0;
  let samples = [];
  const ceiling = Math.max(0, tierIndex(boundedTier(maximumTier)));
  const listeners = new Set();

  const state = () => Object.freeze({
    tier: contextAvailable ? tier : 'lite',
    preference,
    visible,
    reducedMotion,
    contextAvailable,
    motionEnabled: visible && !reducedMotion && contextAvailable && tier !== 'lite',
    budget: GRAPHICS_BUDGETS[contextAvailable ? tier : 'lite'],
  });
  const notify = () => { const snapshot = state(); for (const listener of listeners) listener(snapshot); return snapshot; };
  const setTier = (next) => {
    const target = GRAPHICS_TIERS[Math.min(ceiling, Math.max(0, tierIndex(boundedTier(next))))];
    if (tier === target) return state();
    tier = target;
    lastChangeAt = now();
    fastWindows = 0;
    return notify();
  };
  const setPreference = (value) => {
    if (value !== 'auto' && !GRAPHICS_TIERS.includes(value)) throw new Error('Unknown graphics quality preference.');
    preference = value;
    samples = [];
    if (value !== 'auto') return setTier(value);
    return notify();
  };
  const setVisible = (value) => { visible = Boolean(value); samples = []; return notify(); };
  const setReducedMotion = (value) => { reducedMotion = Boolean(value); return notify(); };
  const contextLost = () => { contextAvailable = false; samples = []; fastWindows = 0; return notify(); };
  const contextRestored = () => {
    contextAvailable = true;
    samples = [];
    if (preference === 'auto') tier = GRAPHICS_TIERS[Math.min(tierIndex(tier), tierIndex('balanced'))];
    lastChangeAt = now();
    return notify();
  };
  const recordFrame = (durationMs) => {
    if (!visible || !contextAvailable || preference !== 'auto' || !Number.isFinite(durationMs) || durationMs <= 0 || durationMs > 1000) return state();
    samples.push(durationMs);
    if (samples.length < sampleSize) return state();
    const sorted = samples.slice().sort((a, b) => a - b);
    const p75 = sorted[Math.floor(sorted.length * .75)];
    samples = [];
    if (now() - lastChangeAt < cooldownMs) return state();
    if (p75 >= slowFrameMs) return setTier(GRAPHICS_TIERS[Math.max(0, tierIndex(tier) - 1)]);
    if (p75 <= fastFrameMs) {
      fastWindows += 1;
      if (fastWindows >= 2) return setTier(GRAPHICS_TIERS[Math.min(ceiling, tierIndex(tier) + 1)]);
    } else fastWindows = 0;
    return state();
  };
  const subscribe = (listener) => { listeners.add(listener); listener(state()); return () => listeners.delete(listener); };
  return Object.freeze({ state, subscribe, setPreference, setVisible, setReducedMotion, contextLost, contextRestored, recordFrame });
}
