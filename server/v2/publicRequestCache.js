export const PUBLIC_PROFILE_CACHE_TTL_MS = 30_000;
export const PUBLIC_PROFILE_CACHE_MAX_ENTRIES = 500;

export function createPublicRequestCache({
  ttlMs = PUBLIC_PROFILE_CACHE_TTL_MS,
  maxEntries = PUBLIC_PROFILE_CACHE_MAX_ENTRIES,
  now = () => Date.now(),
} = {}) {
  if (!Number.isInteger(ttlMs) || ttlMs < 1) throw new TypeError('Cache ttlMs must be a positive integer.');
  if (!Number.isInteger(maxEntries) || maxEntries < 1) throw new TypeError('Cache maxEntries must be a positive integer.');
  const entries = new Map();

  const prune = () => {
    const currentTime = now();
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= currentTime) entries.delete(key);
    }
    while (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
  };

  const get = async (key, loader) => {
    if (typeof loader !== 'function') throw new TypeError('Cache loader must be a function.');
    const cacheKey = String(key);
    const existing = entries.get(cacheKey);
    if (existing && existing.expiresAt > now()) return existing.promise;
    if (existing) entries.delete(cacheKey);
    prune();

    const promise = Promise.resolve().then(loader);
    entries.set(cacheKey, { expiresAt: now() + ttlMs, promise });
    try {
      return await promise;
    } catch (error) {
      if (entries.get(cacheKey)?.promise === promise) entries.delete(cacheKey);
      throw error;
    }
  };

  return {
    get,
    invalidate(key) {
      entries.delete(String(key));
    },
    invalidatePrefix(prefix) {
      const value = String(prefix);
      for (const key of entries.keys()) if (key.startsWith(value)) entries.delete(key);
    },
    clear() {
      entries.clear();
    },
    get size() {
      return entries.size;
    },
  };
}
