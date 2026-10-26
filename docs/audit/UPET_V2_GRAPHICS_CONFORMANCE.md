# Graphics renderer conformance audit

2026-10-26 — final `UPET_MASTERPLAN.md`, Sections 5–7, 8 and 23. Stage 4 remains open. This audit distinguishes actual rendering from names in a selector; it is not a completion certificate.

## Findings and corrections

| Requirement | Audited implementation | Correction / remaining gate |
| --- | --- | --- |
| Polished/brushed/tinted metals, §5.4 | Actual Three.js MeshPhysicalMaterial, beveled geometry, PMREM and directional normal texture | Preserve. CSS reflection bands are fallback only; full optical/device matrix remains |
| Liquid mercury, §5.5 | Previously absent; now original coherent vertex displacement and analytic normals over the same physical shader/environment | GPU implementation verified; static Lite poster does **not** meet the specified animated Lite gate |
| Holographic/thin film, §5.7 | **Deviation:** selectable advanced material was CSS-only | Replaced advanced path with MeshPhysicalMaterial iridescence, bounded film IOR/thickness, original thickness map, pointer tilt and coherent environment shimmer. CSS is now Lite/unavailable only |
| Ordinary clear/frosted/smoked/tinted glass, §§5.1–5.2 | DOM translucency/blur/rim/grain and spring highlight | Preserve: masterplan explicitly permits ordinary DOM glass and says not to allocate GPU merely for frosted cards. These recipes are not advertised as 3D transmission |
| Liquid glass/physical refraction, §§5.1/5.3 | Previously absent, not equivalent to DOM backdrop blur | Added separate physical lens path using native Three.js volume transmission, IOR/thickness/dispersion and original curved mesh normals. It refracts only its own opaque GPU-scene backdrop. Browser verification and remaining optical controls tracked in Stage 4 acceptance |
| Water/fluid/ink and silk, §§5.6/5.8 | Not implemented in the v2 material engine | Remain open; must use coherent GPU wave/plume/fold shading with real controls and useful fallbacks, not CSS relabelling |
| Acrylic/ceramic/plastic/paper/neon, §5.9 | Not implemented as distinct v2 recipes | Remain open; midnight matte is not matte paper. Appropriate physical or DOM path per masterplan, not empty registry entries |
| Background catalogue and Section 7 interaction engines | Existing legacy effects preserved; new catalogue incomplete | Inventory/reuse existing ProfileBits; do not assert name parity is implementation parity. Final Stage 5 cannot begin until Stage 4 gates close |

## Shared pipeline

`src/graphics/materials/physicalSurfaceScene.js` extends the previously verified metal scene; it is not another renderer or canvas. `MaterialSurface` separates GPU eligibility (`isGpuMaterial`) from metal/ordinary DOM-glass classification. Metal, mercury, thin-film and physical lens rendering use the same lazy Three.js engine, PBR environment, quality provider, resource scopes and native foreground HTML. No new dependencies, service, user-data migration or public rollout.

Fixed application-owned shader patches live in `liquidMetalShader.js` and `liquidGlassShader.js`. Incoming profile data can supply only validated bounded values; trusted writes reject executable shader/script fields. Theme/per-layer inheritance and strict public projections remain shared. No HTML screenshot, remote artwork or arbitrary document sampling is used for refraction.

The physical lens uses Three.js's native opaque-scene transmission pass, not CSS blur masquerading as refraction. Its original 128×128 backdrop texture is disclosed in the inspector. A 32/64/96-row lens mesh supplies analytic curved normals. Transmission target resolution is at most half the surface resolution and capped to 512 pixels per dimension on Balanced, 1024 on High/Ultra, also respecting the tier texture cap. The target is adopted through the installed Three.js Texture's documented `renderTarget` reference after rendering and disposed by the same resource scope on Lite/unmount/context loss. This version-sensitive integration has unit and actual WebGL allocation checks; recheck on Three.js upgrades.

## Verification and remaining limits

- Registry/schema, trusted persistence/projection and actual physical-scene unit tests exercise optics, family switches and scoped transmission-target ownership.
- `scripts/check-holographic-material.mjs` checks actual GPU pixel changes from film controls, pointer tilt and shimmer; zero speed/reduced motion freeze, bright/dark/Lite at desktop/mobile and shader/runtime errors. Existing theme background crossfade is allowed to settle before pixel equality assertions.
- `scripts/check-liquid-glass.mjs` checks actual GPU pixel changes from curvature, thickness, IOR and dispersion, readable native content and repeated framebuffer/texture cleanup. Synthetic local transport is **not** Firebase persistence proof.
- Existing lifecycle tests cover one shared context, lazy Lite/no-WebGL, bounded framebuffer/DPR/layers, hidden/offscreen suspension, real context loss/recovery and repeated unmount. These remain required regressions after shared-engine changes.
- Local software Chromium evidence is not physical-device, optical realism or 60-FPS certification. Complete family-specific controls, animated-background/device comparisons and missing Lite animations remain explicit gates in `docs/quality/UPET_STAGE4_ACCEPTANCE.md`.

Continue the same implementation; do not restart finished foundations or mark Stage 4 complete on this correction alone.
