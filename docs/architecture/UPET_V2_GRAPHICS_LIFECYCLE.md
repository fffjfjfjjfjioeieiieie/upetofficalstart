# Shared graphics lifecycle — Stage 3

Verified locally on 2026-10-26. This is the graphics foundation, not completion of the materials/background/effect catalogue.

## Runtime ownership

- `GraphicsProvider.jsx` provides one visitor quality/motion policy at the existing app root. Nested Studio/profile providers reuse the parent. It manages visibility, OS reduced motion and local preference listeners, with cleanup. No auth, Firestore read, quota request or external service is added.
- `qualityPreferences.js` validates and stores only `quality` and `motion` under `upet.graphics.v1`. Auto, Lite, Balanced, High and Ultra are available; motion can follow the OS or reduce further. Corrupt or denied storage has a safe default.
- `GraphicsSceneHost.jsx` owns a canvas, engine and lifecycle. Nested scene hosts reuse their ancestor, including during initial mounting. HTML remains outside the canvas and keeps its native resolution and interactions.
- `graphicsEngine.js` lazy-imports pinned Three.js 0.186.1 only when an actual registered scene is visible and quality permits GPU work. Merely mounting Studio, a renderer or a quality picker creates neither a WebGL context nor a monitor RAF. The engine supports WebGL2, consistent output colour space/tone mapping, viewport/scissor composition and deliberate CSS fallback.
- Across mounted hosts, one context may be owned at a time. Each host accepts at most twelve registered layers; excess hosts/layers retain their HTML/CSS. Scene factories are trusted local implementations, never executable profile configuration.
- `renderScheduler.js` coalesces invalidations into one RAF. Static/reduced-motion scenes render once after changes. Hidden/offscreen scenes stop. The quality manager samples actual animated scene frames; no independent monitor loop runs beside it.
- `resourceCache.js` shares resources by ref-counted leases and separates per-scene owned geometry/materials/textures/render targets. Final lease release disposes shared allocations. One broken disposer cannot strand sibling allocations.

## Adding a scene

Call `useGraphicsLayer(elementRef, createScene, { enabled, animated })` under a host. Keep `createScene` stable (module function or memoized callback). The factory receives `{ THREE, resources, renderer }` and returns `{ scene, camera, update?, dispose? }`.

Register each private GPU allocation with `resources.own(...)`; use `resources.shared(key, create)` for reusable geometry/environment resources with a stable, configuration-specific key. An update receives time, dimensions, effective quality and motion eligibility. User settings are validated before reaching a factory. A failed factory/update falls back for that layer while other layers/content remain usable.

The engine resizes to the intersection of the host and viewport. A very long public page cannot create an enormous offscreen framebuffer. It applies both the tier's DPR cap and pixel cap, additionally bounded by the actual renderer's texture limit. Per-tier animated-surface budgets freeze excess decorative layers while preserving content.

## Loss and cleanup

Context loss cancels pending frames, releases scene scopes, hides the GPU canvas and exposes the existing fallback. Restoration rebuilds scene resources and restarts conservatively for Auto; explicit visitor choices remain intact. Scene failure is isolated and represented by an unavailable state; engine diagnostics retain a bounded error reason.

Unmount removes observers, scroll/resize/context listeners, the quality subscription and capacity registration; cancels RAF; disposes every scene scope/cache/renderer; and explicitly releases the context. Late async module resolution checks disposal before constructing a renderer. Synthetic browser tests exercise StrictMode and four repeated cleanup/remount cycles.

The implementation follows the official [Three.js renderer lifecycle](https://threejs.org/docs/pages/WebGLRenderer) and [separate geometry/material/texture disposal requirements](https://threejs.org/manual/pages/how-to-dispose-of-objects.html).

## Verification boundaries

`npm run test:v2` includes the pure quality, scheduler, preference and resource-lifecycle tests. `scripts/check-graphics-lifecycle.mjs` checks the real renderer in Chromium with synthetic data and blocked external requests. `tests/vite.graphics.config.mjs` builds only the diagnostic fixture into a separate temporary directory for production-bundle verification; it is not an entry in the public build.

The complete local evidence and machine-specific benchmark limits are in `docs/quality/PERFORMANCE_BUDGETS.md`. Physical mobile/GPU/browser matrices and feature-specific material performance remain release/feature-stage work. No real-material or 60-FPS claim follows from a passing lifecycle test.
