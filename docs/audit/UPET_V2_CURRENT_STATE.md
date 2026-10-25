# UPET v2 current-state audit

Audit date: 2026-10-25  
Branch: `feature/upet-studio-v2`  
Audited baseline: `3856dfc` plus the pre-existing local working tree  
Specification: `UPET_MASTERPLAN.md` (final, 2,530 lines)  
Visual reference set: all eight images in `Upet_Noiz_Reference_Screenshots.zip`

This is the Stage 0 inventory for the final UPET rebuild. It describes what exists today, what is active at runtime, and which behavior must be preserved during migration. It is not a claim that the final specification is implemented.

## Safety and release state

- The branch was created from the current working tree without resetting, stashing, deleting, or rewriting existing work.
- The working tree already contained 181 changed paths (80 modified, 5 deleted, and 96 untracked) before Stage 0 documentation was added. Those changes remain intact and are not attributed to this audit commit.
- No production data was read, written, migrated, or deleted during the audit.
- No deployment was performed. The final specification requires an access-controlled founder preview before any public cutover.
- Shop publishing, marketplace access, checkout, Stripe Connect, live payments, and payouts are disabled by policy. They must remain disabled until their own launch gates are approved.
- GitHub reports that `main` is not protected. Branch protection and required checks are therefore a release blocker, not an assumed safeguard.
- The repository is linked to a Vercel project, but deployment-protection settings could not be verified from the available local tooling. Preview access control remains an explicit pre-deployment gate.

## Runtime architecture

The active browser entry point is `src/main.jsx`, which mounts `src/redesign/App.jsx` and imports `src/redesign/index.css`. The older `src/app`, `src/dashboard`, `src/profiles`, and `src/studio` trees are retained migration references rather than the active application shell.

The application currently uses client-side hostname routing:

- The main host renders the landing page, explore, authentication, dashboard, public profile, and public shop routes.
- `shop.user.pet` renders the separate shop shell, which remains founder-only/test-only.
- `help.user.pet` and `/help-preview` render the help centre and staff tooling.
- Vercel rewrites requests to the SPA entry. Social crawler rendering and canonical/OG behavior have not yet been proven for public profile routes.

The main-host route surface currently includes:

- `/`, `/explore`, `/legal`, `/privacy`, `/login`, `/claim`, and `/shop-auth`
- guarded `/dashboard/*`
- `/:username`
- `/:username/shop` and `/:username/shop/chat/:threadId`
- placeholders for terms, support, status, and changelog
- business routes that currently redirect because Business Mode is disabled

There is no active `/:username/:page` multipage profile route yet.

## Toolchain and validation surface

- React 19, React Router 7, Vite 7, Firebase 12, Wavesurfer 8, Stripe 19, Radix primitives, dnd-kit, Motion/Framer Motion, and charting libraries are installed.
- The application is JavaScript/JSX; there is no TypeScript configuration.
- `package.json` exposes `dev`, `build`, `preview`, and only one narrow test script, `test:visitor`.
- There is no repository lint script, typecheck script, aggregate test script, or checked-in CI workflow.
- Three.js/React Three Fiber is not installed, so the final shader/material system does not exist yet.
- `src/redesign/index.js` imports React Query, but that dependency is not installed and that file is not the active entry point. It must not be made active without resolving the dependency and behavior intentionally.

## Existing subsystem inventory

| Area | Current behavior | Final-spec gap / migration concern |
| --- | --- | --- |
| Authentication | Firebase email/password and Google authentication; guarded dashboard routes; username claim flow | Preserve identities and username ownership. Prove redirect, collision, and account recovery behavior. |
| Homepage | Polished link-in-bio landing page with hero preview, top profiles, features, and shop messaging | Must become the final interactive UPET materials/Studio/music/multipage demonstration without losing current navigation or performance. |
| Studio | Dashboard tabs for Media, Entry, Effects, Card, Links, Audio, and Lyrics with a live profile preview | Missing the specified three-panel pages/layers/canvas/inspector workspace, unified block model, mobile authoring, history, and draft/publish separation. |
| Public profile | One public page with identity, links, badges, limited card layouts, limited backgrounds/effects, Discord/TikTok widgets, audio, and lyrics | Missing multipage routing, responsive block canvas, advanced materials, galleries, polls, guestbook, collections, expanded widgets, and final accessibility/performance controls. |
| Music | One uploaded track or one official Spotify/YouTube Music/YouTube/SoundCloud embed; title, artist, cover, autoplay, loop, volume, compact/expanded player styles | Missing reusable library, multiple tracks, playlists, queues, reorder, global player, skin system, and scalable storage model. Existing behavior must remain available during migration. |
| Lyrics | Plain paste, LRC import/export, stable line IDs, undo/redo, WaveSurfer preview, tap sync, marker dragging, start/end times, nudge, pagination, styling, and public synced display | Strongest parity-critical feature. Missing word timing, stanza tools, global offset, waveform zoom, end-handle editing, server revision conflict handling, and multi-track attachment. |
| Media | Owner-scoped Blob/R2 upload APIs, client validation and image compression; legacy Firebase Storage rules remain | Must centralize an asset library, document providers, keep ownership checks trusted, and audit every shipped asset/license before reuse. |
| Discovery | Explore/directory and ranked profile surfaces | Some failure handling collapses backend errors to empty results. Ranking aggregation has an initial N+1 query pattern. Pagination and cost bounds need proof. |
| Analytics | Profile view/click events, counts, recent events, and separate visitor aggregation | Per-interaction Firestore writes and count queries require privacy, retention, budget, and abuse review. Do not add quota reads to normal navigation. |
| Help/moderation | Help articles, tickets, staff views, and moderation-related collections and rules | Partial/in-progress. Bound ticket/message listeners, verify roles server-side, and keep help-host routing intact. |
| Business mode | Source and documentation exist, but active routes are disabled/redirected | Preserve the work; do not advertise it as active or enable it accidentally. |
| Shop | Separate shop host, products, settings, orders, customers, messages, analytics, finances, and marketing source exists | Much of the current shop work is uncommitted. It is founder-only/test-only and must remain protected while final profile work proceeds. |
| Payments | Test-mode Stripe checkout/Connect/refund/webhook logic with server price and commission checks | Preserve paid shop functions, webhook idempotency, and test-mode enforcement. Do not enable live keys, public checkout, seller onboarding, payouts, or marketplace access. |
| Profile premium | Incomplete profile premium/vanity UI and billing concepts exist | Conflicts with the final rule that all profile creation and vanity-domain features are free. Retire or migrate only after separating legitimate shop subscriptions and preserving records. |
| Presets | A small profile preset/badge system exists | Missing the specified 50+ functional presets, compatibility metadata, confidence labels, and independent-reset behavior. |

## Profile data and migration risk

The active profile flow uses these primary documents:

- `profiles/{username}` for a public schema-v1 document containing `ownerUid`, `username`, `status`, and `published`
- `profileDrafts/{uid}` for the editable owner document
- `directoryProfiles/{username}` for public discovery projections
- `profileBadgeGrants/{username}` for badge grants
- `profileRevisions` and profile-event collections for revision/analytics behavior

The active redesign adapter maps legacy profile documents into a smaller UI model. Saving reconstructs a schema-v1 document and embeds redesign data, but fields and blocks not represented in the active model can be lost after an edit/publish cycle. This is a critical migration blocker. Before any v2 editor writes an existing profile, the migration layer must:

1. preserve unknown and legacy fields losslessly;
2. expose an explicit draft and publish boundary;
3. include a revision or equivalent conflict check;
4. prove round-trip parity with fixtures from every supported legacy schema;
5. make rollback possible without rewriting production user records.

Current editor autosave defaults to publishing after the client debounce. That does not satisfy the final draft/publish model and can expose incomplete edits. It must be changed behind compatibility tests before a preview cutover.

## Firebase usage and listener audit

Firestore rules cover profiles, drafts, usernames, directory projections, badge grants, analytics events, access invites, moderation, support/help, business, and shop-related collections. Server-only shop and visitor collections are denied to direct clients.

Positive findings:

- Profile and grant listeners return combined unsubscribe functions.
- Editable-profile listeners return their draft, public-profile, and grant unsubscribes.
- Most chat/help effects return explicit listener cleanup.
- Directory reads are bounded rather than full collection scans.

Required corrections:

- Public profiles use live profile and grant listeners even though most public views do not require realtime updates. Prefer shared, short-lived cached one-time reads.
- Editable profiles maintain three live listeners. Reassess which sources truly need realtime behavior and prevent duplicate subscriptions.
- Owner shop conversations, message lists, support tickets, and ticket messages include unbounded snapshot listeners. Add bounded queries and pagination while retaining access to older records.
- Top-profile aggregation loads directory data and then performs per-profile counts before a batch profile read. Replace this N+1 shape with a maintained aggregate/projection and explicit cache policy.
- Directory failure handling can return an empty result for all backend errors. Surface a distinguishable error unless the screen intentionally renders a documented fallback.
- Profile edits need field grouping, unchanged-write suppression, one in-flight save policy, and server revision protection in addition to the current debounce.
- Founder authorization is represented by hard-coded email allowlists in several client, server, and rules locations. Move privileged authorization to trusted claims/roles before release.

## Media and content audit

The existing public asset tree contains filenames that appear to reference commercial music and video. The audit does not establish licenses or ownership. These assets must not be copied into new demos, preview fixtures, presets, or marketing surfaces until provenance is recorded. Keep them in place until references are mapped and a verified replacement/removal plan exists.

The final implementation should use licensed, original, public-domain, or generated demo media with recorded provenance. User-upload flows must retain rights confirmation and server-side ownership checks.

## Reference screenshot interpretation

All eight supplied screenshots were reviewed at original resolution. They establish quality and interaction references, not reusable assets or layouts:

- a dark feature catalogue with dense capability presentation;
- immersive monochrome profile composition with strong identity and stacked widgets;
- a setup/specification overlay;
- cover-flow-style game discovery;
- editorial gallery and poll treatments;
- starfield editorial game cards and a vertically composed profile.

The rebuild may borrow principles such as spatial hierarchy, layered surfaces, cinematic transitions, and confident typography. It must not copy names, artwork, arrangement, or recognizable trade dress.

## Baseline verification

The repository was validated without production traffic:

- `node --test tests/*.test.js tests/*.test.mjs discord-bot/tests/*.test.js` produced 81 passing tests and one test-loader failure because `tests/shopAdmin.test.mjs` requires Node's module-mocking flag.
- `node --experimental-test-module-mocks --test tests/shopAdmin.test.mjs` then passed all 6 shop-admin tests.
- Effective behavioral baseline: 87 passing tests when invoked with the required flag.
- `npm run build` passed under Vite 7.3.6 (6,389 transformed modules).
- The build emitted non-fatal third-party Zod annotation warnings.
- Large chunks include Firebase, React, charting, validation, and global CSS. Performance budgets and route-level loading need deliberate work.

The package scripts must be corrected in a later stage so one documented command runs the complete suite with the correct Node flags.

## Critical risk register

| Priority | Risk | Required gate |
| --- | --- | --- |
| P0 | Editing can drop legacy profile fields/blocks | Lossless round-trip fixtures and rollback test before v2 writes |
| P0 | Autosave can publish incomplete edits | Separate draft persistence from explicit publish |
| P0 | Main branch is unprotected | Required reviews/checks and branch protection before public cutover |
| P0 | Preview deployment protection is unverified | Confirm founder-only access before first remote preview |
| P0 | Profile premium concepts conflict with final free-profile rule | Separate and preserve shop billing, remove profile paywalls without data loss |
| P0 | Shop/payment surface must remain test-only | Keep policy flags closed and verify keys/mode before every preview |
| P1 | Hard-coded privileged emails | Trusted server role/claim migration and rules tests |
| P1 | Unbounded/N+1 Firestore access | Bounded pagination, projections, cache policy, and emulator/query tests |
| P1 | Unlicensed-looking demo media | Provenance inventory and replacement plan before reuse |
| P1 | No CI, lint, typecheck, or aggregate test script | Reproducible checks required before protected-preview rollout |
| P1 | SPA-only metadata/crawler behavior | Social-card and canonical URL proof for profile/page routes |
| P2 | Large runtime chunks and global CSS | Performance budgets, lazy loading, and low-power quality controls |

## Stage 0 conclusion

The repository contains valuable working foundations, especially authentication, profile identity, shop isolation, and the line-level lyric editor. It is not structurally ready for the final v2 editor or a public cutover. Migration must be additive, compatibility-first, and gated by tests. No obsolete source or data should be deleted until the corresponding v2 capability has parity evidence and a documented rollback path.
