# Graphics budgets and measured evidence

Stage 3 checkpoint: 2026-10-26. These are enforced resource ceilings, not claims that every device meets a particular frame rate.

| Tier | Maximum DPR | Maximum visible canvas pixels | Maximum texture edge for effect factories | Particles | Shader passes | Animated surfaces |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Lite | 1 (HTML/CSS only) | 0 | 0 | 0 | 0 | 0 |
| Balanced | 1.25 | 1,500,000 | 1024 | 80 | 1 | 1 |
| High | 1.75 | 3,000,000 | 2048 | 300 | 2 | 2 |
| Ultra | 2 | 4,000,000 | 2048 | 700 | 3 | 3 |

The scene host enforces canvas DPR/pixels, one context across hosts and twelve registered layers maximum. Factories must consume the particle/pass/texture budgets rather than treating them as permissions to allocate arbitrary assets. Their feature-specific enforcement is verified when the corresponding materials/backgrounds are implemented. Scissoring/composition preserves the native HTML layout. Text, links, audio and content availability never depend on a graphics tier.

Auto samples p75 frame duration in bounded windows, downgrades slow workloads, and requires two fast windows plus a cooldown before upgrading. Hidden and reduced-motion periods are not measurement samples. Unit tests exercise cooldown/hysteresis independently of this machine's timing.

## Production diagnostic measurement

Built with the actual Vite production pipeline via `tests/vite.graphics.config.mjs`, with the shared renderer/Three.js production chunk. Served only at `http://127.0.0.1:5175/tests/graphics-v2-harness.html` from `/tmp/upet-graphics-build.SL0b0Q`. The standard application build remains at localhost port 4173.

Environment: Chromium headless, software ANGLE/SwiftShader, desktop viewport 1440×900, requested DPR 3, forced Ultra, three synthetic TorusKnot scenes sharing one geometry. This is software-renderer diagnostic evidence, not a benchmark of a user's physical GPU or phone.

- 120 measured animated frames after warm-up.
- p50 frame interval: **33.3 ms**; p95: **50 ms** in this run.
- Visible framebuffer: **1,379,840 pixels**, below the forced Ultra ceiling; effective DPR bounded to 2.
- Three.js reported one shared geometry and one internal texture. Repeated remounts returned to the same counts; final unmount released all owned cache entries, the renderer/context and pending RAF.
- Forced Ultra is deliberately allowed for the check; these frame intervals qualify for Auto's slow-workload downgrade. This is not a 60-FPS result. Targeted material/background benchmarks and physical-device tuning remain required in their stages and Stage 17.

Trace: `/tmp/upet-stage3-graphics-trace.zip`. Screenshots: `/tmp/upet-stage3-graphics-{lite,balanced,high,ultra,context-lost}.png` and `/tmp/upet-stage3-graphics-webgl-disabled-mobile.png`. Representative active and fallback screenshots were visually inspected, including a correction to the diagnostic content contrast.

## Verified lifecycle matrix

- Initial Lite: zero WebGL context creations and no Three.js download.
- Balanced/High/Ultra: actual framebuffer DPR and pixel caps hold even when browser DPR is 3.
- Auto choice and persisted Ultra/reduced-motion controls survive a full reload.
- Offscreen intersection and simulated document-hidden events stop frame production; returning resumes.
- Reduced motion produces a static redraw and no continuous/pending frames once settled.
- `WEBGL_lose_context` loss/restoration keeps HTML visible, releases/recreates shared scene resources once, and causes no fatal page error.
- A deliberately broken scene falls back while two valid scenes continue.
- Twenty mounted layers admit twelve GPU registrations, preserving all native content.
- Four unmount/remount cycles release the context/cache/RAF and do not accumulate geometry.
- WebGL2 disabled at 390px: native HTML, CSS fallback, OS reduced motion and no horizontal overflow.
- Normal production homepage at desktop/mobile: no GPU module request; auth/help route smoke is recorded in the progress ledger.

## Bundle boundary

Three.js is a separate lazy chunk: approximately 746.8 kB raw / 190.3 kB gzip in this build. The Vite large-chunk warning is retained honestly. Ordinary homepage rendering does not request this chunk. Never preload it globally or instantiate a shader for each catalogue thumbnail. Later stages must measure selected-effect startup, interaction latency, long tasks and GPU cost before increasing complexity.
