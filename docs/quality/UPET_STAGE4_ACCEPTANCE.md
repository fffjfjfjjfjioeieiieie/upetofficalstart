# Stage 4 acceptance — material and effect engine

Canonical scope: final masterplan Sections 5–7 / Section 23 Stage 4. Updated 2026-10-26. **Stage 4 is in progress.** A working first material slice does not close this stage; Stage 5 must not start yet.

## Verified first slice

- A server-safe bounded material schema and schema-driven Studio controls now cover the five existing recipes. Tint, radius and edge strength apply across those recipes; blur/tint strength apply to DOM glass; roughness/reflection/light direction apply to the chrome mesh. Unsupported controls are not advertised as working physics.
- Theme defaults and explicit per-block material overrides use the same MaterialSurface in the actual shared renderer. “Use profile material” removes the override without changing the block's content/layout or other styles.
- Chrome uses a beveled Three.js MeshPhysicalMaterial and a shared PMREM capture of original procedural light panels. No external artwork/environment map is fetched. The scene updates only for invalidation/interaction; it does not run a perpetual decorative animation.
- The shared resource scope disposes replaced geometry immediately. Context/layer/texture bounds remain in effect. Paused/offscreen/lost scenes show CSS fallback while their canvas is unavailable. Shader compilation failures also fall back and release owned geometry/program resources.
- Trusted draft saves validate material settings before transaction I/O. Publishing preserves bounded controls but strips private extensions from public projections. Executable shader/script fields are rejected. Untrusted read settings fall back safely, including prototype-named keys.

Verification: `npm run test:v2` passed 54/54; production build passed with Vite 7.3.6, 6,436 modules. `scripts/check-material-controls.mjs` passed at 1440px/390px, including chrome GPU/Lite, keyboard roughness changes, glass blur, override/reset, no overflow and no page/shader errors. It uses a clearly synthetic local transport stub, **not** Firebase persistence proof. Trusted persistence/projection checks use the in-memory repository integration fixture. Actual migrated-account save/reload remains a Stage 6 gate.

The lifecycle browser check was repeated against development modules with a deliberately invalid shader: the failed scene releases its geometry/program while two valid scenes continue, and context-loss/cleanup checks still pass. The earlier production lifecycle benchmark remains recorded separately.

Screenshots `/tmp/upet-stage4-chrome-card-{1440,390}.png`, `/tmp/upet-stage4-chrome-{1440,390}.png`, and `/tmp/upet-stage4-chrome-lite-{1440,390}.png` were captured. Native text stays legible; initial procedural lighting was refined after inspection. Full polished-material art direction/bright and animated background comparisons remain open. The material card screenshots are the reliable GPU evidence: full-page browser captures can temporarily change the viewport, so the check resets scroll and waits for an invalidated draw before capture.

## Material completion gates

| Required family | Current state | Remaining gate |
| --- | --- | --- |
| Clear/crystal glass | DOM translucency, bounded blur/tint/radius/rim depth/width and spring pointer light | Remaining optical controls/optional GPU-composited cases and complete visual matrix; no arbitrary DOM-refraction claim |
| Frosted/smoked/tinted glass | Distinct DOM diffusion/absorption recipes, independent grain, rim controls and spring pointer light | Animated-background and wider device/contrast matrix remains |
| Liquid glass | Not implemented | Coherent bounded lens edge/normal displacement, controls, pointer behavior and Lite silhouette |
| Polished chrome | First real PBR mesh/environment and controls | Finish visual calibration and full background/tier comparison |
| Brushed steel/gold/rose gold/dark metal | Shared PBR variants and Lite recipes implemented locally | Final art-direction, animated-background and release/device matrix remain |
| Liquid metal/mercury | Not implemented | Coherent animated normals/displacement and controlled reflections, no random rainbow noise |
| Water/fluid/ink | Not implemented | Continuous ripples/plumes, damping/pointer/normal behavior and bounded low-cost fallback |
| Holographic/iridescent/thin film | CSS fallback only | Geometry/view-dependent lighting, bounded spectral parameters and motion policy |
| Silk/fabric | Not implemented | Fold/sheen/flow behavior with coherent lighting and useful Lite rendering |
| Acrylic/ceramic/glossy plastic/matte paper/neon | Not implemented | Distinct actual recipes/physical properties, readable content and controls; midnight matte is not matte paper |

Every family needs meaningful bounded controls, working shared-renderer preview, useful defaults, per-component inheritance/override, reduced-motion behavior, recovery and bright/dark/animated-background plus Lite evidence. Do not add empty catalogue entries for future materials.

### Metal-family follow-up (verified 2026-10-26)

The registry now has nine actual choices: the previous five plus brushed steel, gold, rose gold and dark metal. The chrome scene was moved to `metalScene.js` and reused for all five metals; the old import was replaced and the production build verifies the move. Distinct tint/roughness/reflection defaults affect the actual physical material. Brushed steel adds an original 128×128 directional normal texture, bounded anisotropy/rotation, and a matching directional surface/Lite grain treatment. These are not five independent canvases or downloaded texture packs.

The same stable scene survives metal selection and parameter edits; the procedural environment stays shared. Nonmetal surfaces no longer perform pointer-layout reads for an unused GPU light. A regression test also fixes ID-only material parity: published defaults now exactly match the owner's family-specific defaults rather than generic schema defaults.

`npm run test:v2` passed **56/56** and `npm run build` passed (Vite 7.3.6, 6,436 modules). The expanded material browser check passed all five metals in GPU and Lite, with bright/dark surrounding backgrounds at 1440px/390px, OS reduced motion, keyboard brush direction, override/reset, and no runtime/shader errors or overflow. Representative brushed-steel, gold GPU and rose-gold Lite screenshots were visually inspected. Evidence: `/tmp/upet-stage4-{brushed-steel,gold,rose-gold,dark-metal}-{dark,bright,lite}-{1440,390}.png`. Animated-background and wider physical-device checks remain open; this does not close Stage 4.

### DOM-glass follow-up (verified 2026-10-26)

Clear, frosted, smoked and tinted glass now have distinct diffusion/absorption defaults, an actual translucent background, independently adjustable grain, bounded edge width/depth, and a damped spring highlight using the existing Motion dependency. Grain zero removes the noise layer. The native text has a deliberate contrast veil; the Lite recipe removes backdrop filtering and keeps the surface/foreground. OS/manual reduced motion resets and stops pointer lighting; touch does not start it. Ordinary glass never allocates WebGL or downloads Three.js.

`scripts/check-glass-materials.mjs` passed all four on bright/dark backgrounds and Lite at 1440px/390px, including actual computed blur/edge/grain, spring response, reduced-motion reset, touch fallback, zero GL/download calls, no errors and no horizontal overflow. Representative clear, smoked mobile and tinted screenshots were visually inspected. Evidence: `/tmp/upet-stage4-{crystal,frosted,smoked-glass,tinted-glass}-{bright,dark,lite}-{1440,390}.png`. The existing shared renderer/legacy/Studio browser regression also passed, and explicit schema-version-zero legacy documents retain their classic fallback.

`npm run test:v2` passed **57/57**; the production build passed (Vite 7.3.6, 6,436 modules). The registry has eleven working material choices. These are DOM glass implementations, not claims of physical mesh transmission or refraction of arbitrary HTML. Full Stage 4 optical/effect and animated-background gates remain open.

## Section 7 engine completion gates

Inventory and wrap useful existing effects in `src/redesign/components/ProfileBits.jsx` before introducing replacements. The active legacy effects are preserved; no new registry can claim complete parity merely because their names exist.

- Ten border behaviors: electric, gradient orbit, chrome edge, glass edge, neon breathing, rainbow sweep, pulse outline, shimmer, particle border, holographic edge.
- Ten card interactions: spring lift, 3D tilt, specular follow, magnetic card, soft scale, parallax depth, shadow bloom, glass wake, border reveal and focus-accessible content reveal.
- Eighteen typography behaviors from Section 7.3, including actual grapheme/word reveal, resolved scramble, controlled glitch, pointer/scroll behavior and static accessible text.
- Cursor choices from Section 7.4 on pointer-capable devices, including visitor override and touch/reduced-motion fallback.
- Entrances/transitions from Section 7.5, including interruptible easing, skip behavior and shared-background continuity.

Each applicable registry entry needs real rendering, safe settings, compatible-component application, reduced-motion behavior and test/screenshot evidence. Use CSS/SVG for ordinary borders/text; reserve the shared GPU scene for effects that benefit from it. The complete Section 6 background catalogue is Stage 5, after these Stage 4 gates.
