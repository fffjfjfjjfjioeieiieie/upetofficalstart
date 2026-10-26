import './materialSurface.css';
import { useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { isGlassMaterial, isGpuMaterial, isMetalMaterial, normalizeMaterialConfig } from './materialRegistry.js';
import { useGraphicsContext } from '../core/GraphicsProvider.jsx';
import { useGraphicsInvalidation, useGraphicsLayer } from '../core/GraphicsSceneHost.jsx';
import { createPhysicalSurfaceScene } from './physicalSurfaceScene.js';

export default function MaterialSurface({ variant = 'matte', config, reducedMotion = false, className = '', style, children }) {
  const graphics = useGraphicsContext();
  const settings = normalizeMaterialConfig(config || { id: variant });
  const elementRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const rippleRef = useRef({ sequence: 0, x: 0, y: 0 });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const metal = isMetalMaterial(settings.id);
  const physical = isGpuMaterial(settings.id);
  const glass = isGlassMaterial(settings.id);
  const highlightX = useMotionValue(20);
  const highlightY = useMotionValue(10);
  const springX = useSpring(highlightX, { stiffness: 170, damping: 25, mass: .7 });
  const springY = useSpring(highlightY, { stiffness: 170, damping: 25, mass: .7 });
  const gpuTargetX = useMotionValue(0);
  const gpuTargetY = useMotionValue(0);
  const gpuSpringX = useSpring(gpuTargetX, { stiffness: 170, damping: 25, mass: .7 });
  const gpuSpringY = useSpring(gpuTargetY, { stiffness: 170, damping: 25, mass: .7 });
  const createScene = useMemo(() => (context) => createPhysicalSurfaceScene({ ...context, readSettings: () => ({ ...settingsRef.current, pointer: pointerRef.current, ripple: rippleRef.current }) }), [createPhysicalSurfaceScene]);
  const animated = (['liquid-metal', 'water', 'silk'].includes(settings.id) && settings.flowSpeed > 0)
    || (settings.id === 'holographic' && settings.shimmerSpeed > 0)
    || (settings.id === 'liquid-glass' && settings.lensWaveStrength > 0 && settings.lensWaveSpeed > 0);
  const status = useGraphicsLayer(elementRef, createScene, { enabled: physical && graphics.tier !== 'lite', animated: animated && !reducedMotion });
  const effectiveStatus = physical && graphics.tier !== 'lite' ? status : 'fallback';
  const invalidate = useGraphicsInvalidation();
  const settingsKey = JSON.stringify(settings);
  useEffect(() => invalidate?.(), [invalidate, settingsKey]);
  useEffect(() => {
    if (!physical || !graphics.visible || graphics.reducedMotion || reducedMotion || graphics.tier === 'lite') {
      gpuTargetX.set(0); gpuTargetY.set(0);
      gpuSpringX.jump(0); gpuSpringY.jump(0);
      pointerRef.current = { x: 0, y: 0 };
      invalidate?.();
      return undefined;
    }
    const update = () => {
      pointerRef.current = { x: gpuSpringX.get(), y: gpuSpringY.get() };
      invalidate?.();
    };
    const stopX = gpuSpringX.on('change', update);
    const stopY = gpuSpringY.on('change', update);
    return () => { stopX(); stopY(); };
  }, [physical, graphics.visible, graphics.reducedMotion, graphics.tier, reducedMotion, gpuTargetX, gpuTargetY, gpuSpringX, gpuSpringY, invalidate]);
  useEffect(() => {
    if ((glass || physical) && graphics.visible && !graphics.reducedMotion && !reducedMotion && graphics.tier !== 'lite') return;
    pointerRef.current = { x: 0, y: 0 };
    highlightX.set(20); highlightY.set(10); springX.jump(20); springY.jump(10);
    invalidate?.();
  }, [glass, physical, graphics.visible, graphics.reducedMotion, graphics.tier, reducedMotion, highlightX, highlightY, springX, springY, invalidate]);
  const onPointerMove = (event) => {
    if ((!physical && !glass) || event.pointerType !== 'mouse' || graphics.reducedMotion || reducedMotion || !graphics.visible || graphics.tier === 'lite') return;
    const bounds = elementRef.current.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const pointer = { x: Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)), y: Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)) };
    if (glass) { highlightX.set((pointer.x + 1) * 50); highlightY.set((pointer.y + 1) * 50); }
    if (physical) { gpuTargetX.set(pointer.x); gpuTargetY.set(pointer.y); }
  };
  const onPointerDown = (event) => {
    if (settings.id !== 'water' || graphics.reducedMotion || reducedMotion || !graphics.visible || graphics.tier === 'lite' || event.target.closest('a,button,input,select,textarea')) return;
    const bounds = elementRef.current.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    rippleRef.current = { sequence: rippleRef.current.sequence + 1, x: Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)), y: Math.max(-1, Math.min(1, 1 - (event.clientY - bounds.top) / bounds.height * 2)) };
    invalidate?.();
  };
  return <motion.div ref={elementRef}
    className={`upet-material upet-material--${settings.id} ${metal ? 'upet-material--metal' : ''} ${physical ? 'upet-material--physical' : ''} ${glass ? 'upet-material--dom-glass' : ''} ${className}`.trim()}
    data-material={settings.id} data-quality={graphics.tier} data-gpu-state={effectiveStatus} data-reduced-motion={reducedMotion || graphics.reducedMotion ? 'true' : 'false'}
    onPointerMove={onPointerMove} onPointerDown={onPointerDown} onPointerLeave={() => { gpuTargetX.set(0); gpuTargetY.set(0); highlightX.set(20); highlightY.set(10); }}
    style={{ ...style, borderRadius: settings.radius, borderWidth: glass ? settings.edgeWidth : 1, '--upet-material-tint': settings.tint, '--upet-material-blur': `${settings.blur}px`, '--upet-material-opacity': settings.opacity, '--upet-material-edge': settings.edgeIntensity, '--upet-material-edge-depth': `${settings.edgeDepth}px`, '--upet-material-grain': settings.grain, '--upet-material-highlight-x': springX, '--upet-material-highlight-y': springY, '--upet-material-brush-strength': settings.brushStrength, '--upet-material-brush-direction': `${settings.brushDirection}deg` }}>
    <div className="upet-material__content">{children}</div>
  </motion.div>;
}
