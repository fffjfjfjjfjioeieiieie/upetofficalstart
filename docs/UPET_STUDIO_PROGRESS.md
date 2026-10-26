# UPET Studio v2 progress

Last updated: 2026-10-26 (Stages 0–3 verified; Stage 4 first material slice verified)
Working branch: `feature/upet-studio-v2`  
Baseline commit: `3856dfc` plus the preserved pre-existing working tree  
Public deployment: **not authorized while unfinished**

This is the continuation ledger for the final `UPET_MASTERPLAN.md`. Future sessions must read this file, the final masterplan, the current-state audit, and the migration map before changing implementation code.

## Current checkpoint

The user's 2026-10-25 correction requires sequential completion against **Section 23 of the final masterplan**. The previous ledger and migration map incorrectly renumbered the stages; their earlier “Stage 5 complete” claim described only core editor interactions, not the final masterplan's background catalogue. That claim is withdrawn. Existing verified work is retained as groundwork for its actual stage.

Stages 0–3 have now been checked in final-masterplan order and verified locally. Stage 2 includes the actual shared renderer foundation; Stage 3 includes the quality provider, lazy shared context, bounded scheduler and resource lifecycle, native visitor controls, fallbacks and real production-bundle context-loss tests. **Stage 4 is the first unfinished stage**: its first verified slice adds bounded controls, per-block overrides and an actual chrome PBR scene/shared original environment to the five CSS fallback recipes. Its remaining full catalogue/effect gates are in `docs/quality/UPET_STAGE4_ACCEPTANCE.md`. Stage 6 is still partial; later feature stages remain unfinished. No production claims, data migration, public route cutover, merge or remote deployment has occurred. Local production preview was restarted and verified at `http://127.0.0.1:4173/`; the synthetic Studio fixture is `http://127.0.0.1:5174/tests/studio-v2-harness.html`. The isolated Stage 3 production fixture was served on port 5175 for its benchmark; restart its preview command if needed.

The working tree was already dirty before this stage. At branch creation it contained 181 changed paths: 80 modified, 5 deleted, and 96 untracked. These files are preserved in place and are not part of the Stage 0 documentation commit unless explicitly listed by that commit.

## Stage ledger

| Stage | Status | Evidence / next gate |
| --- | --- | --- |
| 0. Repo audit and import/dependency map | Verified locally | Current-state audit, import scanner/full graph, route/service map, rollback and external unknowns documented |
| 1. Shared design tokens and compatible UI primitives | Verified locally | Shared tokens/Button/IconButton/VisuallyHidden; existing working Radix controls reused; five tests and recorded visual comparison. Inactive unresolved wrappers quarantined in import map |
| 2. Profile schemas, legacy adapters and renderer foundations | Verified locally | Lossless rollback/write gate; shared versioned ProfileRenderer powers Studio; strict public/private boundary; four legacy fixtures across three formats; verification below |
| 3. Graphics quality manager and shared renderer lifecycle | Verified locally | Shared provider/scene host, one lazy context, actual-frame scheduler, DPR/pixel/layer limits, scoped/ref-count disposal, persisted visitor controls; production context loss/restore, WebGL-disabled, hidden/offscreen/reduced-motion and repeated-unmount matrix passed |
| 4. Material/effect engine (Sections 5–7) | In progress — remain here | First slice: bounded trusted controls/public projections, per-layer overrides, real chrome PBR/shared procedural PMREM, CSS/Lite fallback. Full material families and Section 7 engines/visual matrix remain; acceptance checklist linked above |
| 5. Background/effect catalogue (Sections 6–7) | Not started | Every named effect needs actual renderer, controls, fallbacks, tier and screenshot proof |
| 6. Studio canvas/inspector/draft/publish | Partial groundwork | Founder shell, core blocks/layout/history, serialized private draft API, explicit publish, local rules tests. Full component/feature parity, real isolated save/reload and responsive UX remain |
| 7. Multi-page layouts/navigation | Not started | Deep link/back/forward/mobile, layout catalogue and public versioned route integration |
| 8. Music migration/playlists/skins/analysis | Not started | Preserve uploads/embeds/waveform/synced lyrics first; then complete library/queue/skins/analysis |
| 9. Galleries/collections/content widgets | Not started | Real collection CRUD, provenance, mobile and keyboard operations |
| 10. Authorized external social integrations | Not started | Actual scopes/privacy, rate limits, disconnect/unavailable states |
| 11. Guestbook/polls/reactions/donor badges | Not started | Trusted access rules, moderation and real isolated data tests |
| 12. Analytics/links/SEO/sharing | Partial security groundwork only | Ranking cache/backfill is not rollout; real bounded events, owner access, metadata/crawler proof remain |
| 13. 50+ presets/theme scheduling/backups | Not started | Distinct functional templates, safe restore/import and schedule behavior |
| 14. Homepage with actual demos | Not started | Shared renderer, working routes, mobile hero, lazy GPU/performance proof |
| 15. Free vanity subdomain/optional BYOD | Not started | Ownership, DNS/HTTPS or explicit external blocker; no profile paywall |
| 16. Safe legacy cleanup | Not started | Evidence per deletion and rollback; no legacy source removed |
| 17. Comprehensive QA/security/performance | Not started | Full visual/device/cost/security/migration and shop/help/business regression gates |
| 18. Protected founder preview release | Not started | Verified founder access and public-site isolation |
| 19. Public launch | Awaiting future explicit approval | Complete readiness and rollout/rollback proof required |

### Sequential recheck evidence (2026-10-26)

- Stage 0: `node scripts/audit-source-imports.mjs` found 319 files, 672 local edges, zero unresolved local imports/parse errors. `--json` returns every module/edge. See `docs/audit/UPET_V2_IMPORT_MAP.md` for runtime chains, actual package gaps, classifications and rollback. No deletions or production operations.
- Stage 1: existing shared token/control tests remain passing. Existing production pages keep their compatibility aliases; functional Radix slider/switch/dialog/input controls remain the reused implementations. The original before/after visual proof is in `docs/audit/UPET_V2_VISUAL_BASELINE.md`; unused wrappers with absent dependencies are explicitly quarantined.
- Stage 2: `npm run test:v2` passed 43/43 and `node --test tests/profileRenderModelV2.test.mjs` passed 3/3. Existing round-trip fixtures now include a complete schema-v1 record in addition to sparse archival data. Public rendering rejects canonical/private fields, unknown future schema versions fail safely, hidden content stays hidden, unsupported blocks show an owner placeholder and are omitted for visitors, mobile layout falls back safely, long-page coordinates remain distinct.
- `node scripts/check-profile-renderer.mjs` passed at 1440px/390px: all legacy fixture paths, safe escaped text, unknown-block handling, Studio shared-renderer edit/undo/redo/keyboard nudge, zero runtime errors or horizontal overflow. All API/external requests are intercepted. This machine uses `UPET_CHROMIUM_EXECUTABLE=/home/lamp/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell` because its cached browser revision differs from the installed Playwright default.
- Screenshots `/tmp/upet-stage2-renderer-{1440,390}.png` and `/tmp/upet-stage2-shared-studio-{1440,390}.png` are synthetic local data. The native public and owner views share ProfileRenderer; Studio adds editing overlays via its render callback. Existing public v1 routes remain the compatibility default. Full feature parity and public route cutover are later stage gates, not claims of this foundation.
- Final Stage 2 build passed (Vite 7.3.7, 6,452 modules). The desktop shared-Studio screenshot and mobile compatibility sheet were visually inspected; a leaked heading selector was corrected and the final browser pass repeated. Local production preview returned HTTP 200. Existing Zod annotation warnings remain non-fatal. `test:v2` now includes the three renderer tests (46 total).

### Stage 3 verification (2026-10-26, final-masterplan numbering)

- `npm run test:v2`: 51 passed, including actual resource ownership, scheduler coalescing/cleanup, storage failure and same-tier preference-notification checks. Later focused quality/lifecycle checks passed 8/8 after final cleanup refinements.
- Final `npm run build`: passed with Vite 7.3.6 and 6,434 transformed modules, including native public visitor controls. Node modules were reconciled to the existing lockfile when installing exact Three.js 0.186.1; no existing lockfile package version was changed. Existing unrelated dependency edits remain in the worktree and are excluded from the stage commit. The 746.8 kB raw / 190.3 kB gzip Three.js chunk is lazy, with its size warning retained.
- Production diagnostic build: `npx vite build --config tests/vite.graphics.config.mjs --outDir /tmp/upet-graphics-build.SL0b0Q`, then preview only on localhost port 5175. `UPET_LOCAL_PREVIEW_ORIGIN=http://127.0.0.1:5175 UPET_CHROMIUM_EXECUTABLE=/home/lamp/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell node scripts/check-graphics-lifecycle.mjs` passed.
- That browser matrix verifies initial Lite has zero GL creations/Three.js downloads; three scenes share one context/geometry; all forced GPU tiers obey framebuffer/DPR caps; Auto and visitor motion choices persist through reload; offscreen/hidden/reduced-motion suspension; real context loss/restoration; isolated scene failure; 12-layer budget; four unmount/remount cycles without resource accumulation; WebGL-disabled 390px fallback without overflow or fatal page errors.
- Measured software-renderer production diagnostic: 120 Ultra frames, p50 33.3 ms, p95 50 ms, 1,379,840 pixels. These are not physical-device/60-FPS claims. See `docs/quality/PERFORMANCE_BUDGETS.md`; trace `/tmp/upet-stage3-graphics-trace.zip`. Active and no-WebGL screenshots were visually inspected and diagnostic text contrast improved.
- Production application smoke at 1440px/390px: homepage renders without overflow or a GPU module request, anonymous dashboard redirects to `/login?next=/dashboard`, Help preview route loads, zero page errors. All API/external traffic intercepted; no production data read. Local production preview continues to return HTTP 200.
- `scripts/check-profile-renderer.mjs` also checks the native public visitor controls, shared Studio edit/undo/redo/nudge, legacy compatibility and mobile fallback. Stage 3 architecture/ownership is recorded in `docs/architecture/UPET_V2_GRAPHICS_LIFECYCLE.md`.

### Stage 4 first working slice (2026-10-26; not stage completion)

`npm run test:v2` passed 54/54. `npm run build` passed (Vite 7.3.6, 6,436 modules). `scripts/check-material-controls.mjs` passed chrome GPU/Lite, native content, keyboard controls, glass blur, independent layer override/reset, desktop/mobile, no runtime/shader errors or horizontal overflow. Its save transport is a visual-only local stub; actual trusted behavior is checked with repository integration tests, not production Firebase. Public projections retain the bounded controls and omit private material extensions; invalid/executable settings are rejected before draft transaction I/O.

`scripts/check-graphics-lifecycle.mjs` also passed after the core was hardened for actual shader compilation failure and immediate geometry replacement. The failed shader releases its private geometry/program while two valid scenes continue. Paused/offscreen surfaces explicitly show fallback, preventing transparent gaps. Representative chrome GPU card and Lite screenshots at desktop/mobile were visually inspected. Detailed remaining work is in `docs/quality/UPET_STAGE4_ACCEPTANCE.md`; do not move to Stage 5.

The previous localhost preview process stopped responding during work; it was restarted with `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`, then returned HTTP 200. The Vite synthetic preview on 5174 remains available. No public deployment or production data operation.

## Earlier verification records

The records below preserve the previous session's evidence. Their old stage numbers were an internal subdivision and are superseded by the canonical table above: old 3/4/5 map to partial final Stage 6, and old 6 maps to partial final Stages 3/4. They must never be used to mark the final stages complete.

## Baseline verification

Run on 2026-10-25 without production traffic:

```text
node --test tests/*.test.js tests/*.test.mjs discord-bot/tests/*.test.js
  81 passed; shopAdmin loader failed because module mocks need an explicit Node flag

node --experimental-test-module-mocks --test tests/shopAdmin.test.mjs
  6 passed

npm run build
  passed; Vite 7.3.6; 6,389 modules transformed
```

Effective behavioral baseline: 87 passing tests under the correct invocations. The build has non-fatal Zod annotation warnings and several large chunks. There is no aggregate test script, lint script, typecheck, or CI workflow yet.

Stage 1 verification:

```text
node --test tests/sharedUi.test.mjs
  5 passed

local Playwright smoke checks
  homepage: desktop + mobile, six sections each
  dashboard: anonymous redirect preserved at desktop + mobile
  13/14 visual captures byte-identical; remaining hero capture visually identical
  no unnamed interactive controls under the smoke-test heuristic
  reduced-motion token resolves to 1ms

npm run build
  passed; Vite 7.3.6; 6,391 modules transformed
```

The visual procedure and its environment limitations are recorded in `docs/audit/UPET_V2_VISUAL_BASELINE.md`.

Stage 2 verification:

```text
node --test tests/profileContracts.test.mjs
  7 passed
```

The contracts and their privacy/write boundaries are recorded in `docs/architecture/UPET_V2_DATA_CONTRACTS.md`. They are additive and are not imported by the current Firestore save/publish path.

Stage 3 domain-foundation verification:

```text
node --test tests/profileContracts.test.mjs tests/profilePublishV2.test.mjs tests/firestoreProfileRepositoryV2.test.mjs
  17 passed
```

The projection, publish, claims, cache and query boundaries are recorded in `docs/architecture/UPET_V2_PUBLISH_SECURITY.md`. These functions perform no external I/O and are not connected to the current production writer.

Stage 3 local integration verification (2026-10-25):

```text
npm run test:v2
  32 passed, 0 failed
JAVA_HOME=/tmp/upet-jre/jdk-21.0.13+9-jre PATH=/tmp/upet-jre/jdk-21.0.13+9-jre/bin:$PATH npm run test:rules:v2
  6 passed against demo-upet-v2 Firestore emulator, 0 failed
node --test tests/topProfiles.test.mjs tests/rateLimit.test.mjs tests/visitor.test.js
  9 passed, 0 failed
npm run build
  passed; Vite 7.3.7; 6,421 modules transformed
curl -I http://127.0.0.1:4173/
  HTTP 200 from localhost production preview
```

Local browser smoke: desktop and 390px mobile homepage loaded without page errors or horizontal overflow; anonymous dashboard/help routes loaded. Captures: `/tmp/upet-stage3-home-desktop.png` and `/tmp/upet-stage3-home-mobile.png`. This is a regression check, not a visual sign-off for the new Studio, which has not been built.

Stage 3 added a trusted draft save with owner/username verification and compare-and-swap draft/published revisions; unchanged saves make no write and do not publish. Explicit publish validates dependency ownership and writes canonical/public/directory/revision/lyrics projections atomically. Public profile and track-bound lyrics use bounded shared caches and strict allowlists. Claims migration and ranking backfill scripts default to dry-run. New profile views use an aggregate instead of a directory scan plus per-profile counts. Current chat/help/analytics listeners were bounded with older-record paging; any unresolved parity gaps are tracked in the next gate.

Stage 4 local shell verification (2026-10-25):

```text
npm run test:v2
  35 passed, 0 failed (including preview access and serialized draft-save tests)
npm run build
  passed; Vite 7.3.7; 6,430 modules transformed
local Vite visual harness at http://127.0.0.1:5174/tests/studio-v2-harness.html
  desktop 1440px and mobile 390px: two pages, no page errors, no horizontal overflow
  add page + rename page interaction: passed on mobile, no page errors
curl -I http://127.0.0.1:4173/dashboard/studio-v2
  HTTP 200 from localhost production preview
```

Screenshots: `/tmp/upet-stage4-studio-1440.png` and `/tmp/upet-stage4-studio-390.png`; both visually inspected. The harness uses a private synthetic draft and makes no Firebase/API calls during initial render. It proves shell layout/controls, not authenticated end-to-end save or a production rollout. The actual route checks a refreshed founder token and owner-only draft; an account without a v2 draft sees the migration gate and current editor link. A successful publish now returns the rebased draft revision so subsequent saves do not conflict.

Stage 5 interaction checkpoint (2026-10-25):

```text
npm run test:v2
  37 passed, 0 failed (including block order and history invariants)
local browser harness at http://127.0.0.1:5174/tests/studio-v2-harness.html
  desktop: add heading/text, pointer drag text above heading, no page errors or overflow
  desktop: keyboard Space/ArrowUp/Space also reorders layers
  mobile 390px: block controls and inspector visible, no page errors or overflow
npm run build
  passed; Vite 7.3.7; 6,431 modules transformed, updated Studio chunk emitted
```

Visual captures: `/tmp/upet-stage5-studio-desktop.png` and `/tmp/upet-stage5-studio-mobile.png`; inspected. The canvas currently previews three core block types using a temporary shell renderer. It is not yet the shared public profile renderer; do not claim exact published parity until Stage 11. The browser harness uses only synthetic data and does not validate a real Firebase save.

Stage 5 responsive-layout follow-up: independent desktop/mobile viewport controls now edit each block's validated x/y/width/height/rotation fields, and the private canvas applies those coordinates without horizontal clipping at 1440px or 390px. The mobile screenshot `/tmp/upet-stage5-layout-390.png` was visually inspected.

Stage 5 local completion gate: the existing `src/profiles/layouts/EditableCanvasItem.jsx` now accepts opt-in minimums, grids and a visible touch-sized resize handle while keeping its legacy defaults. Studio maps drag/resize commits back to normalized v2 desktop/mobile geometry only when the gesture ends; no per-frame Firebase writes. Browser checks: pointer drag changed x/y, resize changed width/height, keyboard arrow/shift-arrow nudged a selected block, and an emulated touch drag moved a block by 60px. The desktop resize capture `/tmp/upet-stage5-resize.png` was visually inspected. `npm run test:v2` passed 39/39, `npm run build` passed, and localhost production preview remains HTTP 200. The only unverified part of this stage is live Firebase save/reload with a migrated draft; it remains blocked by the safe migration gate rather than silently simulated.

Stage 6 foundation verification (2026-10-25):

```text
npm run test:v2
  43 passed, 0 failed (quality manager and material registry added)
npm run build
  passed; Vite 7.3.7; Stage 6 Studio chunk emitted
local visual harness
  crystal, frosted, chrome, holographic on dark background; holographic on bright background
  mobile frosted with reduced motion: no page errors or horizontal overflow
```

The pure quality manager exposes Lite/Balanced/High/Ultra resource budgets, bounded DPR, p75 frame windows, downgrade cooldown and two-window upgrade hysteresis. Context loss forces Lite, context restoration returns to a conservative auto tier, and hidden/reduced-motion states suspend animation eligibility. The Studio-mounted monitor unregisters media/visibility listeners and cancels its RAF on unmount. These are policy/lifecycle foundations, not a measured FPS claim. `MaterialSurface` is a shared allowlisted DOM/CSS fallback with readable HTML content; no new paid service or WebGL context is mounted. Screenshots `/tmp/upet-stage6-crystal-dark.png`, `/tmp/upet-stage6-chrome-dark.png` and `/tmp/upet-stage6-holographic-bright.png` were visually inspected. Do not describe chrome as full PBR or glass as real DOM refraction.

## Feature parity ledger

| Capability | Existing baseline | Final target | Status |
| --- | --- | --- | --- |
| Auth and username ownership | Firebase email/password + Google, claim flow | Preserved identities, hardened ownership and recovery | Partial; audit only |
| Homepage | Link-in-bio hero, profiles, feature/shop sections | Real Studio/material/music/pages showcase | Partial; not migrated |
| Studio | Tabbed editor and right preview | Unified three-panel pages/layers/canvas/inspector authoring | Partial; not migrated |
| Public profiles | Single page, responsive cards | Versioned multipage block renderer | Partial; not migrated |
| Identity, links, entry | Implemented in active redesign | Expanded but fully compatible | Partial; parity fixtures missing |
| Materials/backgrounds | Limited CSS/background effects | Layered materials, shaders, fallbacks and quality tiers | Not implemented |
| Music | Single upload or official embed | Library, multi-track, playlists, queue, global player, skins | Partial; parity-critical |
| Lyrics | Plain/LRC, line sync, tap, drag, nudge, undo/redo, export | Track-bound revisioned line/stanza/word waveform editor | Strong partial; parity-critical |
| Media | Blob/R2 owner-scoped APIs plus legacy URLs | Unified asset library and provenance | Partial; migration needed |
| Galleries/collections/video | Some legacy concepts/assets | Responsive blocks and collections | Not implemented in active renderer |
| Widgets | Discord and TikTok cards | Registry with resilient accessible widgets | Partial |
| Polls/guestbook/community | No complete active surface | Moderated community blocks | Not implemented |
| Discovery | Directory and top profiles | Cached, paginated, projection-based discovery | Partial; query issues |
| Analytics | View/click and visitor aggregation | Privacy-aware bounded analytics | Partial; cost/privacy review |
| Domains | Conflicting premium/vanity concepts | Free profile capability with safe verification | Not compliant |
| Presets | Small profile preset/badge system | 50+ functional compatibility-labelled presets | Partial |
| Help/moderation | Articles, tickets and staff views | Hardened, paginated, trusted roles | Partial |
| Business Mode | Source retained, routes disabled | Preserve optional product without accidental activation | Disabled/preserved |
| Shop | Broad founder-only/test-only implementation | Preserved, regression-tested, separately launched | Protected partial |
| Stripe | Test-mode server flows and webhooks | Preserved shop billing; live rollout separately approved | Protected/test-only |

## Non-negotiable migration constraints

- Do not reset, discard, or silently absorb the pre-existing working tree.
- Do not write a v2 profile until lossless legacy round-trip tests pass.
- Do not let autosave publish; draft save and explicit publish must be separate.
- Do not remove legacy source or assets before reference and parity evidence is recorded.
- Do not hide Firestore errors as empty success results without an intentional UI fallback.
- Bound and paginate listeners; return every snapshot unsubscribe from its React effect.
- Do not authorize ownership or privileged roles from client state or email alone.
- Keep profile creation/features free. Preserve legitimate paid shop goods/services and records.
- Keep shop publishing, marketplace, checkout, Stripe Connect, live payments, and payouts closed.
- Do not reuse questionable commercial media in demos or presets without provenance.
- Do not deploy an unfinished build publicly. Any early remote preview must be founder-only and access-controlled.

## Open release blockers

1. V1 autosave-to-publish remains active until the v2 Studio can use draft save and an audited cutover. Legacy write mode remains blocked.
2. Unverified Vercel preview protection and unprotected GitHub `main`; no remote preview deployed.
3. Production trusted founder claims and recovery UID migration have not run. Do not enable v2 route or deploy the claim-based rules until claims are set and refreshed.
4. One-time ranking backfill must run before enabling the aggregate reader/event writer; it has only been dry-run/unit tested. Older-record paging requires an authenticated browser parity check.
5. CI, lint, typecheck, and formal performance budgets remain absent.
6. Profile premium/vanity concepts conflict with the final free-profile rule.
7. Asset licensing/provenance is unverified.
8. Social crawler/SEO behavior for dynamic profile pages is unproven.

## Next exact task

Continue final-masterplan Stage 4, without advancing to Stage 5. Next concrete slice: finish Section 5.4's brushed steel, gold, rose gold and dark metal using the existing chrome scene/environment rather than duplicate renderers; add directional brush texture/anisotropy, distinct safe defaults and Lite recipes, bounded controls and visual checks. Then complete the other Section 5 families and the Section 7 border/card/text/cursor/entrance engines listed in `docs/quality/UPET_STAGE4_ACCEPTANCE.md`. Bright/dark/animated-background, tier and reduced-motion verification are still required before Stage 4 can close. Stage 5 remains the complete Section 6 background catalogue. No stage may be declared complete merely because its first slice builds.

Before any production cutover: safely stage the overlapping Stage 3 edits in `firestore.rules`, `firestore.indexes.json`, `server/topProfiles.js`, `src/data/analyticsStore.js`, `src/help/lib/helpStore.js`, `src/help/pages/{StaffPages,TicketPages}.jsx`, `src/redesign/lib/firebaseStore.js`, and `src/redesign/pages/Explore.jsx` without absorbing the user's unrelated dirty changes. Run the founder-claim and ranking-backfill scripts only under an explicit approved rollout with rollback evidence. `package.json`/lockfile also contain unrelated pre-existing dependency edits; keep those intact.
