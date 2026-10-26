import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createGraphicsQualityManager, initialGraphicsTier } from '../quality/qualityManager.js';
import { GRAPHICS_PREFERENCE_KEY, readGraphicsPreferences, writeGraphicsPreferences } from '../quality/qualityPreferences.js';

const GraphicsContext = createContext(null);
const localStorageOrNull = () => { try { return globalThis.localStorage; } catch { return null; } };

function OwnedGraphicsProvider({ children }) {
  const [preferences, setPreferences] = useState(() => readGraphicsPreferences(localStorageOrNull()));
  const managerRef = useRef(null);
  if (!managerRef.current) {
    const device = globalThis.navigator || {};
    managerRef.current = createGraphicsQualityManager({ initialTier: initialGraphicsTier({
      saveData: device.connection?.saveData === true,
      deviceMemory: device.deviceMemory,
      hardwareConcurrency: device.hardwareConcurrency,
    }) });
    managerRef.current.setPreference(preferences.quality);
  }
  const manager = managerRef.current;
  const [snapshot, setSnapshot] = useState(manager.state);
  useEffect(() => manager.subscribe(setSnapshot), [manager]);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => manager.setReducedMotion(motion.matches || preferences.motion === 'reduce');
    const syncVisibility = () => manager.setVisible(!document.hidden);
    syncMotion();
    syncVisibility();
    motion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      motion.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [manager, preferences.motion]);
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== null && event.key !== GRAPHICS_PREFERENCE_KEY) return;
      const next = readGraphicsPreferences(localStorageOrNull());
      setPreferences(next);
      manager.setPreference(next.quality);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [manager]);
  const updatePreferences = (patch) => {
    setPreferences((current) => writeGraphicsPreferences(localStorageOrNull(), { ...current, ...patch }));
    if (patch.quality) manager.setPreference(patch.quality);
  };
  return <GraphicsContext.Provider value={{
    ...snapshot, manager,
    motionPreference: preferences.motion,
    setPreference: (quality) => updatePreferences({ quality }),
    setMotionPreference: (motion) => updatePreferences({ motion }),
  }}>{children}</GraphicsContext.Provider>;
}

export function GraphicsProvider({ children }) {
  const inherited = useContext(GraphicsContext);
  return inherited ? children : <OwnedGraphicsProvider>{children}</OwnedGraphicsProvider>;
}

export function useGraphicsContext() {
  const context = useContext(GraphicsContext);
  if (!context) throw new Error('Graphics controls need a GraphicsProvider.');
  return context;
}
