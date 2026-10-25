# UPET Studio v2 progress

Last updated: 2026-10-25  
Working branch: `feature/upet-studio-v2`  
Baseline commit: `3856dfc` plus the preserved pre-existing working tree  
Public deployment: **not authorized while unfinished**

This is the continuation ledger for the final `UPET_MASTERPLAN.md`. Future sessions must read this file, the final masterplan, the current-state audit, and the migration map before changing implementation code.

## Current checkpoint

Stage 0 is complete locally: the full final masterplan and all eight reference screenshots were reviewed, the runtime/data/payment surfaces were audited, a migration architecture was recorded, the baseline test suite was run correctly, and the production build passed. No remote deployment or production-data operation was performed.

The working tree was already dirty before this stage. At branch creation it contained 181 changed paths: 80 modified, 5 deleted, and 96 untracked. These files are preserved in place and are not part of the Stage 0 documentation commit unless explicitly listed by that commit.

## Stage ledger

| Stage | Status | Evidence / next gate |
| --- | --- | --- |
| 0. Audit and migration plan | Complete locally | Current-state audit, migration map, this ledger; tests/build below |
| 1. Shared tokens and primitives | Not started | Capture local visual baseline, then extract tokens/primitives without changing behavior |
| 2. Versioned data contracts | Not started | Lossless legacy profile round-trip fixtures required first |
| 3. Draft/publish/security foundation | Not started | Emulator coverage, trusted roles, revision conflicts, bounded access |
| 4. Studio shell | Not started | Founder-only route and legacy editor escape hatch |
| 5. Core editor interactions | Not started | Responsive canvas, history, keyboard, drag/reorder tests |
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

1. Lossy legacy-profile adapter and autosave-to-publish behavior.
2. Unverified Vercel preview protection and unprotected GitHub `main`.
3. Hard-coded privileged email allowlists rather than trusted roles/claims.
4. Unbounded listeners and N+1 ranking queries.
5. No aggregate test command, CI, lint, typecheck, or formal performance budgets.
6. Profile premium/vanity concepts conflict with the final free-profile rule.
7. Asset licensing/provenance is unverified.
8. Social crawler/SEO behavior for dynamic profile pages is unproven.

## Next exact task

Begin Stage 1 locally:

1. Read the local preview instructions required by the Sites workflow.
2. Capture representative desktop and mobile baselines for the homepage, dashboard editor, and public profile without deploying.
3. Inventory the active CSS variables and UI primitives against the final token/accessibility requirements.
4. Introduce a single shared token source and the first accessible primitives in small commits, preserving current visuals and behavior.
5. Run focused component tests and one production build, update this ledger, and commit only the verified Stage 1 changes.

If source integration overlaps the pre-existing uncommitted work in a way that cannot be staged safely, document the exact files and stop before overwriting or bundling unrelated changes.
