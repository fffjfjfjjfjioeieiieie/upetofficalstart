import { useEffect, useRef, useState } from 'react';
import { createGraphicsQualityManager, initialGraphicsTier } from './qualityManager.js';

export function useGraphicsQuality(enabled = true) {
  const managerRef = useRef(null);
  if (!managerRef.current) managerRef.current = createGraphicsQualityManager({
    initialTier: initialGraphicsTier({
      saveData: navigator.connection?.saveData === true,
      deviceMemory: navigator.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
    }),
    maximumTier: 'high',
  });
  const manager = managerRef.current;
  const [snapshot, setSnapshot] = useState(manager.state);

  useEffect(() => manager.subscribe(setSnapshot), [manager]);
  useEffect(() => {
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)') || { matches: false };
    const syncMotion = () => manager.setReducedMotion(motion.matches);
    const syncVisibility = () => manager.setVisible(!document.hidden);
    syncMotion();
    syncVisibility();
    motion.addEventListener?.('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      motion.removeEventListener?.('change', syncMotion);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [manager]);
  useEffect(() => {
    if (!enabled || !snapshot.visible || snapshot.reducedMotion) return undefined;
    let frame = 0;
    let previous = 0;
    const tick = (timestamp) => {
      if (previous) manager.recordFrame(timestamp - previous);
      previous = timestamp;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, manager, snapshot.visible, snapshot.reducedMotion]);

  return { ...snapshot, setPreference: manager.setPreference, contextLost: manager.contextLost, contextRestored: manager.contextRestored };
}
