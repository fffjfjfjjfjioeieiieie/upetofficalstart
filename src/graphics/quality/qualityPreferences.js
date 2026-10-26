export const GRAPHICS_PREFERENCE_KEY = 'upet.graphics.v1';
export const QUALITY_CHOICES = Object.freeze(['auto', 'lite', 'balanced', 'high', 'ultra']);
export const DEFAULT_GRAPHICS_PREFERENCES = Object.freeze({ quality: 'auto', motion: 'system' });

export function readGraphicsPreferences(storage) {
  try {
    const value = JSON.parse(storage?.getItem(GRAPHICS_PREFERENCE_KEY) || 'null');
    return {
      quality: QUALITY_CHOICES.includes(value?.quality) ? value.quality : 'auto',
      motion: value?.motion === 'reduce' ? 'reduce' : 'system',
    };
  } catch { return { ...DEFAULT_GRAPHICS_PREFERENCES }; }
}

export function writeGraphicsPreferences(storage, preferences) {
  const value = {
    quality: QUALITY_CHOICES.includes(preferences.quality) ? preferences.quality : 'auto',
    motion: preferences.motion === 'reduce' ? 'reduce' : 'system',
  };
  try { storage?.setItem(GRAPHICS_PREFERENCE_KEY, JSON.stringify(value)); } catch { /* Storage-disabled browsing stays usable. */ }
  return value;
}
