import { boundedGraphicsDpr } from '../quality/qualityManager.js';
import { createRenderScheduler } from './renderScheduler.js';
import { createGraphicsResourceCache, createGraphicsResourceScope } from './resourceCache.js';

// One optional context across mounted profile/demo hosts. Surfaces share it;
// excess hosts keep native CSS/HTML until capacity is released.
const contextOwners = new Set();
const capacityListeners = new Set();
let threeModule;
const loadThree = () => threeModule ||= import('three');
export const graphicsContextCount = () => contextOwners.size;

export function createGraphicsEngine({ host, canvas, manager, onState = () => {} }) {
  const entries = new Map();
  const resources = createGraphicsResourceCache();
  const view = host.ownerDocument.defaultView;
  const document = host.ownerDocument;
  let renderer = null;
  let context = null;
  let THREE;
  let disposed = false;
  let loading = false;
  let lost = false;
  let failed = false;
  let hostVisible = !view.IntersectionObserver;
  let previousFrame = 0;
  let status = 'idle';
  let frameTimes = [];
  let lastSize = '';
  let lastError = '';
  const owner = Symbol('upet-graphics-context');
  const snapshot = () => ({
    status, lastError, contextCount: contextOwners.size, layers: entries.size,
    scheduler: scheduler.snapshot(), resources: resources.snapshot(),
    memory: renderer ? { ...renderer.info.memory } : { geometries: 0, textures: 0 },
    pixelWidth: canvas.width, pixelHeight: canvas.height,
    frameTimesMs: frameTimes.slice(),
  });
  function emit(next) {
    status = next;
    canvas.style.visibility = next === 'ready' ? 'visible' : 'hidden';
    onState(snapshot());
  }
  function setEntryStatus(entry, value) {
    if (entry.status === value) return;
    entry.status = value;
    entry.onStatus?.(value);
  }
  function disposeEntry(entry) {
    try { entry.scene?.dispose?.(); } finally { entry.scope?.dispose(); entry.scene = null; entry.scope = null; }
  }
  function clearScenes() {
    for (const entry of entries.values()) {
      try { disposeEntry(entry); } catch { /* Continue releasing the other owned resources. */ }
      setEntryStatus(entry, 'fallback');
    }
  }
  const visibleEntries = () => [...entries.values()].filter((entry) => entry.visible && !entry.failed);
  const mayRender = () => !disposed && !lost && !failed && hostVisible && manager.state().visible && manager.state().tier !== 'lite' && visibleEntries().length > 0;

  async function start() {
    if (renderer || loading || !mayRender()) return;
    if (contextOwners.size >= 1 && !contextOwners.has(owner)) { emit('budget'); return; }
    contextOwners.add(owner);
    loading = true;
    emit('loading');
    try {
      context = canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'low-power', premultipliedAlpha: true });
      if (!context) throw new Error('WebGL2 is unavailable.');
      THREE = await loadThree();
      if (disposed) return;
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: false });
      renderer.autoClear = false;
      renderer.setClearColor(0, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      emit('ready');
    } catch (error) {
      lastError = String(error?.message || 'Graphics initialization failed.').slice(0, 300);
      if (!disposed) {
        failed = true;
        manager.contextLost();
        clearScenes();
        emit('unavailable');
      }
      context?.getExtension('WEBGL_lose_context')?.loseContext();
      context = null;
      contextOwners.delete(owner);
      for (const listener of capacityListeners) listener();
    } finally { loading = false; }
    reconcile();
  }

  function reconcile() {
    if (disposed) return;
    const eligible = mayRender();
    if (!eligible) {
      previousFrame = 0;
      scheduler.setPaused(true);
      if (manager.state().tier === 'lite') clearScenes();
      if (!lost && !failed) emit('paused');
      return;
    }
    if (!renderer) { start(); return; }
    emit('ready');
    scheduler.setPaused(false);
    scheduler.setContinuous(manager.state().motionEnabled && visibleEntries().some((entry) => entry.animated));
    scheduler.invalidate();
  }

  function render(timestamp) {
    if (!mayRender() || !renderer) return;
    const quality = manager.state();
    const bounds = host.getBoundingClientRect();
    // Allocate only the visible part of a long profile, never a 100,000px canvas.
    const clip = { left: Math.max(0, bounds.left), top: Math.max(0, bounds.top), right: Math.min(view.innerWidth, bounds.right), bottom: Math.min(view.innerHeight, bounds.bottom) };
    const width = Math.max(0, clip.right - clip.left);
    const height = Math.max(0, clip.bottom - clip.top);
    if (!width || !height) { scheduler.setContinuous(false); return; }
    const dpr = Math.min(boundedGraphicsDpr(quality.tier, view.devicePixelRatio), Math.sqrt(quality.budget.maxPixels / (width * height)), renderer.capabilities.maxTextureSize / Math.max(width, height));
    const sizeKey = `${width}:${height}:${dpr}`;
    if (sizeKey !== lastSize) {
      lastSize = sizeKey;
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
    }
    Object.assign(canvas.style, { left: `${clip.left - bounds.left}px`, top: `${clip.top - bounds.top}px`, width: `${width}px`, height: `${height}px` });
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    let animatedIndex = 0;
    for (const entry of visibleEntries()) {
      const rect = entry.element.getBoundingClientRect();
      const left = Math.max(clip.left, rect.left);
      const right = Math.min(clip.right, rect.right);
      const top = Math.max(clip.top, rect.top);
      const bottom = Math.min(clip.bottom, rect.bottom);
      if (right <= left || bottom <= top || !rect.width || !rect.height) continue;
      try {
        if (!entry.scene) {
          entry.scope = createGraphicsResourceScope(resources);
          entry.scene = entry.createScene({ THREE, resources: entry.scope, renderer });
          if (!entry.scene?.scene || !entry.scene?.camera) throw new Error('A graphics layer needs a scene and camera.');
        }
        const motionEnabled = quality.motionEnabled && entry.animated && animatedIndex++ < quality.budget.animatedSurfaces;
        entry.scene.update?.({ time: motionEnabled ? timestamp / 1000 : 0, width: rect.width, height: rect.height, quality, motionEnabled });
        renderer.setViewport(rect.left - clip.left, clip.bottom - rect.bottom, rect.width, rect.height);
        renderer.setScissor(left - clip.left, clip.bottom - bottom, right - left, bottom - top);
        renderer.clearDepth();
        renderer.render(entry.scene.scene, entry.scene.camera);
        setEntryStatus(entry, 'ready');
      } catch (error) {
        lastError = String(error?.message || 'Graphics layer failed.').slice(0, 300);
        entry.failed = true;
        try { disposeEntry(entry); } catch { /* Preserve other layers and native content. */ }
        setEntryStatus(entry, 'unavailable');
      }
    }
    renderer.setScissorTest(false);
    if (quality.motionEnabled && previousFrame) {
      const duration = timestamp - previousFrame;
      if (duration > 0 && duration < 1000) {
        frameTimes.push(duration);
        if (frameTimes.length > 240) frameTimes.shift();
        manager.recordFrame(duration);
      }
    }
    previousFrame = quality.motionEnabled ? timestamp : 0;
    if (!visibleEntries().length) scheduler.setContinuous(false);
  }

  const scheduler = createRenderScheduler({ render, requestFrame: view.requestAnimationFrame.bind(view), cancelFrame: view.cancelAnimationFrame.bind(view) });
  const resizeObserver = view.ResizeObserver ? new view.ResizeObserver(reconcile) : null;
  const intersectionObserver = view.IntersectionObserver ? new view.IntersectionObserver((observed) => {
    for (const item of observed) {
      if (item.target === host) hostVisible = item.isIntersecting;
      else for (const entry of entries.values()) if (entry.element === item.target) entry.visible = item.isIntersecting;
    }
    reconcile();
  }) : null;
  resizeObserver?.observe(host);
  intersectionObserver?.observe(host);
  const onLost = (event) => {
    event.preventDefault();
    if (disposed) return;
    lost = true;
    scheduler.setPaused(true);
    manager.contextLost();
    clearScenes();
    emit('lost');
  };
  const onRestored = () => {
    if (disposed) return;
    lost = false;
    previousFrame = 0;
    lastSize = '';
    manager.contextRestored();
    reconcile();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  view.addEventListener('resize', reconcile);
  document.addEventListener('scroll', reconcile, { capture: true, passive: true });
  capacityListeners.add(reconcile);
  const unsubscribe = manager.subscribe(reconcile);
  emit('idle');
  return {
    register({ element, createScene, animated = true, onStatus }) {
      if (disposed || entries.size >= 12) { onStatus?.('budget'); return () => {}; }
      const id = Symbol('graphics-layer');
      const entry = { element, createScene, animated, onStatus, visible: !intersectionObserver, failed: false, scene: null, scope: null };
      entries.set(id, entry);
      intersectionObserver?.observe(element);
      resizeObserver?.observe(element);
      reconcile();
      return () => {
        intersectionObserver?.unobserve(element);
        resizeObserver?.unobserve(element);
        try { disposeEntry(entry); } finally { entries.delete(id); reconcile(); }
      };
    },
    invalidate: reconcile,
    diagnostics: snapshot,
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      capacityListeners.delete(reconcile);
      scheduler.dispose();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      view.removeEventListener('resize', reconcile);
      document.removeEventListener('scroll', reconcile, true);
      clearScenes();
      entries.clear();
      resources.dispose();
      renderer?.dispose();
      if (renderer) renderer.forceContextLoss();
      else context?.getExtension('WEBGL_lose_context')?.loseContext();
      renderer = null;
      context = null;
      contextOwners.delete(owner);
      for (const listener of capacityListeners) listener();
      emit('disposed');
    },
  };
}
