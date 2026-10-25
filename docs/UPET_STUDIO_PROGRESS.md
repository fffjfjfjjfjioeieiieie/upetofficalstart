# UPET Studio v2 progress

Last updated: 2026-10-25 (Stage 5 editor interaction checkpoint)
Working branch: `feature/upet-studio-v2`  
Baseline commit: `3856dfc` plus the preserved pre-existing working tree  
Public deployment: **not authorized while unfinished**

This is the continuation ledger for the final `UPET_MASTERPLAN.md`. Future sessions must read this file, the final masterplan, the current-state audit, and the migration map before changing implementation code.

## Current checkpoint

Stages 0 through 2 are complete locally. Stage 3 has an isolated, founder-preview-only draft/publish route, verified local rules/projection boundaries, bounded legacy listeners, ranking aggregation/backfill code, and an emulator gate. Stage 4 has a preview-gated Studio shell with pages, layers, canvas, inspector, private draft controls and a current-editor escape hatch. Stage 5 has begun with schema-backed blocks, selection, list reorder and undo/redo. None is a production migration: no live claims or ranking aggregates have been migrated, v1 autosave remains active, and the v2 API is disabled unless explicitly enabled. No remote deployment or production-data operation was performed. The latest verified build is served at `http://127.0.0.1:4173/` for local inspection.

The working tree was already dirty before this stage. At branch creation it contained 181 changed paths: 80 modified, 5 deleted, and 96 untracked. These files are preserved in place and are not part of the Stage 0 documentation commit unless explicitly listed by that commit.

## Stage ledger

| Stage | Status | Evidence / next gate |
| --- | --- | --- |
| 0. Audit and migration plan | Complete locally | Current-state audit, migration map, this ledger; tests/build below |
| 1. Shared tokens and primitives | Complete locally | Shared semantic/compatibility tokens, Button, IconButton, VisuallyHidden, five tests, local visual comparison, production build |
| 2. Versioned data contracts | Complete locally | V2 canonical contracts, three legacy fixture shapes, detached rollback, track-bound lyric adapter and hard legacy-write gate |
| 3. Draft/publish/security foundation | Verified locally; rollout blocked | Emulator rules 6/6, v2 domain tests 32/32, build passed. Production claim migration, ranking backfill and v1 writer cutover are intentionally pending; see next gate. |
| 4. Studio shell | Shell verified locally; live integration pending | `/dashboard/studio-v2` localhost/flag gate, refreshed founder claim, private draft load, serialized debounced save, explicit publish, current-editor escape; desktop/mobile harness pass. Live founder-token and migrated-draft browser check blocked by safe migration gate. |
| 5. Core editor interactions | In progress | Native v2 heading/text/divider blocks, selection and inspector, pointer/keyboard sortable layers, bounded/coalesced undo/redo, independent desktop/mobile coordinate and size controls; direct canvas drag/resize and live-save browser test remain. |
| 6. Materials and backgrounds | Not started | CSS fallback, quality manager, reduced-motion and performance budgets |
| 7. Existing profile-feature parity | Not started | Identity/links/entry/effects/widgets/badges parity matrix |
| 8. Media and galleries | Not started | Asset library, provenance, collections and responsive media |
| 9. Music system | Not started | Existing upload/embed parity before multi-track/playlists/global player |
| 10. Advanced lyrics/waveform | Not started | Preserve LRC/tap sync/drag/nudge/export; add track-bound revisions |
| 11. Multipage public profiles | Not started | Versioned renderer, `/:username/:page`, SEO/social/mobile/a11y proof |
| 12. Community features | Not started | Moderation, privacy, abuse limits and deletion behavior |
| 13. Discovery and analytics | Not started | Projection/caching design, no N+1, bounded queries, retention |
| 14. Domains | Not started | Free-profile policy, ownership verification and collision tests |
| 15. Preset library | Not started | 50+ functional, compatible presets and independent reset |
| 16. Homepage | Not started | Real renderer-driven demonstration, performance and accessibility |
| 17. Cross-product compatibility | Not started | Shop/help/business regression with commerce still protected |
| 18. Hardening and release candidate | Not started | Browser/device/security/cost/a11y/performance/migration checklist |
| 19. Approved cutover and cleanup | Not started | Explicit release approval, rollback rehearsal, removal inventory |

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

Stage 5 responsive-layout follow-up: independent desktop/mobile viewport controls now edit each block's validated x/y/width/height/rotation fields, and the private canvas applies those coordinates without horizontal clipping at 1440px or 390px. Focused document-ops tests pass 3/3, the local visual harness reports no page errors, and `npm run build` passes. The mobile screenshot `/tmp/upet-stage5-layout-390.png` was visually inspected. Direct manipulation on the canvas is still pending.

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

Continue Stage 5 without enabling v2 in production: add direct canvas drag/resize with commit-on-stop, keyboard nudging and pointer/touch tests against the now-validated responsive layout fields. Keep all edits in the owner-only draft coordinator; publish must stay explicit. After those gates, replace the temporary Studio preview block rendering with the shared versioned public renderer in its dedicated stage. The Stage 4 live-auth/browser save check remains pending until a safe migrated v2 draft and verified founder claim exist in an approved test environment.

Before any production cutover: safely stage the overlapping Stage 3 edits in `firestore.rules`, `firestore.indexes.json`, `server/topProfiles.js`, `src/data/analyticsStore.js`, `src/help/lib/helpStore.js`, `src/help/pages/{StaffPages,TicketPages}.jsx`, `src/redesign/lib/firebaseStore.js`, and `src/redesign/pages/Explore.jsx` without absorbing the user's unrelated dirty changes. Run the founder-claim and ranking-backfill scripts only under an explicit approved rollout with rollback evidence. `package.json`/lockfile also contain unrelated pre-existing dependency edits; keep those intact.
