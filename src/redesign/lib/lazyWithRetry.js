import { lazy } from 'react';

const chunkError = (error) => /chunkloaderror|failed to fetch dynamically imported module|loading chunk|importing a module script failed/i.test(String(error?.message || error || ''));

export function lazyWithRetry(importer, name) {
  const recoveryKey = `upet:chunk-recovery:${name}`;
  const load = async () => {
    try {
      const module = await importer();
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(recoveryKey);
      return module;
    } catch (error) {
      if (typeof window !== 'undefined' && chunkError(error) && !sessionStorage.getItem(recoveryKey)) {
        sessionStorage.setItem(recoveryKey, String(Date.now()));
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  };
  const Component = lazy(load);
  Component.preload = load;
  return Component;
}
