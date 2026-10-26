import './materialSurface.css';
import { useEffect, useMemo, useRef } from 'react';
import { isMetalMaterial, normalizeMaterialConfig } from './materialRegistry.js';
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
  const createScene = useMemo(() => (context) => createMetalScene({ ...context, readSettings: () => ({ ...settingsRef.current, pointer: pointerRef.current }) }), []);
  const status = useGraphicsLayer(elementRef, createScene, { enabled: metal && graphics.tier !== 'lite', animated: false });
  const effectiveStatus = metal && graphics.tier !== 'lite' ? status : 'fallback';
  const invalidate = useGraphicsInvalidation();
  const settingsKey = JSON.stringify(settings);
  useEffect(() => invalidate?.(), [invalidate, settingsKey]);
  const onPointerMove = (event) => {
    if (!metal || event.pointerType !== 'mouse' || graphics.reducedMotion || reducedMotion) return;
    const bounds = elementRef.current.getBoundingClientRect();
    pointerRef.current = { x: Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)), y: Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)) };
    invalidate?.();
  };
  return <div ref={elementRef} className={`upet-material upet-material--${settings.id} ${metal ? 'upet-material--metal' : ''} ${className}`.trim()} data-material={settings.id} data-quality={graphics.tier} data-gpu-state={effectiveStatus} data-reduced-motion={reducedMotion || graphics.reducedMotion ? 'true' : 'false'} onPointerMove={onPointerMove} onPointerLeave={() => { pointerRef.current = { x: 0, y: 0 }; if (metal) invalidate?.(); }} style={{ ...style, borderRadius: settings.radius, '--upet-material-tint': settings.tint, '--upet-material-blur': `${settings.blur}px`, '--upet-material-opacity': settings.opacity, '--upet-material-edge': settings.edgeIntensity, '--upet-material-brush-strength': settings.brushStrength, '--upet-material-brush-direction': `${settings.brushDirection}deg` }}><div className="upet-material__content">{children}</div></div>;
}
