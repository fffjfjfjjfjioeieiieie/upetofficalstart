import './materialSurface.css';
import { useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { isGlassMaterial, isMetalMaterial, normalizeMaterialConfig } from './materialRegistry.js';
import { useGraphicsContext } from '../core/GraphicsProvider.jsx';
import { useGraphicsInvalidation, useGraphicsLayer } from '../core/GraphicsSceneHost.jsx';
import { createMetalScene } from './metalScene.js';

export default function MaterialSurface({ variant = 'matte', config, reducedMotion = false, className = '', style, children }) {
  const graphics = useGraphicsContext();
  const settings = normalizeMaterialConfig(config || { id: variant });
  const elementRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const metal = isMetalMaterial(settings.id);
  const glass = isGlassMaterial(settings.id);
  const highlightX = useMotionValue(20);
  const highlightY = useMotionValue(10);
  const springX = useSpring(highlightX, { stiffness: 170, damping: 25, mass: .7 });
  const springY = useSpring(highlightY, { stiffness: 170, damping: 25, mass: .7 });
  const createScene = useMemo(() => (context) => createMetalScene({ ...context, readSettings: () => ({ ...settingsRef.current, pointer: pointerRef.current }) }), [createMetalScene]);
  const status = useGraphicsLayer(elementRef, createScene, { enabled: metal && graphics.tier !== 'lite', animated: settings.id === 'liquid-metal' && settings.flowSpeed > 0 && !reducedMotion });
  const effectiveStatus = metal && graphics.tier !== 'lite' ? status : 'fallback';
  const invalidate = useGraphicsInvalidation();
  const settingsKey = JSON.stringify(settings);
  useEffect(() => invalidate?.(), [invalidate, settingsKey]);
  useEffect(() => {
    if (glass && graphics.visible && !graphics.reducedMotion && !reducedMotion && graphics.tier !== 'lite') return;
    highlightX.set(20); highlightY.set(10); springX.jump(20); springY.jump(10);
  }, [glass, graphics.visible, graphics.reducedMotion, graphics.tier, reducedMotion, highlightX, highlightY, springX, springY]);
  const onPointerMove = (event) => {
    if ((!metal && !glass) || event.pointerType !== 'mouse' || graphics.reducedMotion || reducedMotion || !graphics.visible || graphics.tier === 'lite') return;
    const bounds = elementRef.current.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    pointerRef.current = { x: Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)), y: Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)) };
    if (glass) { highlightX.set((pointerRef.current.x + 1) * 50); highlightY.set((pointerRef.current.y + 1) * 50); }
    if (metal) invalidate?.();
  };
  return <motion.div ref={elementRef} className={`upet-material upet-material--${settings.id} ${metal ? 'upet-material--metal' : ''} ${glass ? 'upet-material--dom-glass' : ''} ${className}`.trim()} data-material={settings.id} data-quality={graphics.tier} data-gpu-state={effectiveStatus} data-reduced-motion={reducedMotion || graphics.reducedMotion ? 'true' : 'false'} onPointerMove={onPointerMove} onPointerLeave={() => { pointerRef.current = { x: 0, y: 0 }; highlightX.set(20); highlightY.set(10); if (metal) invalidate?.(); }} style={{ ...style, borderRadius: settings.radius, borderWidth: glass ? settings.edgeWidth : 1, '--upet-material-tint': settings.tint, '--upet-material-blur': `${settings.blur}px`, '--upet-material-opacity': settings.opacity, '--upet-material-edge': settings.edgeIntensity, '--upet-material-edge-depth': `${settings.edgeDepth}px`, '--upet-material-grain': settings.grain, '--upet-material-highlight-x': springX, '--upet-material-highlight-y': springY, '--upet-material-brush-strength': settings.brushStrength, '--upet-material-brush-direction': `${settings.brushDirection}deg` }}><div className="upet-material__content">{children}</div></motion.div>;
}
