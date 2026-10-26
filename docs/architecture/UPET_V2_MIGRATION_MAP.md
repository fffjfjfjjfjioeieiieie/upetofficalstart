# UPET v2 migration map

Date: 2026-10-25  
Branch: `feature/upet-studio-v2`  
Canonical current-state audit: `docs/audit/UPET_V2_CURRENT_STATE.md`

This map translates the final masterplan into an incremental architecture. The central rule is additive migration: preserve the active product, introduce stable shared contracts, move one vertical capability at a time, and delete old code only after parity, data compatibility, rollback, and reference checks are documented.

## Architectural boundaries

The target source responsibilities are:

```text
src/
  app/                 application bootstrap, providers, host and route composition
  features/            vertical product capabilities
    auth/
    profiles/
    studio/
    music/
    lyrics/
    media/
    community/
    discovery/
    analytics/
    domains/
    shop/
    help/
  shared/
    firebase/           client adapters only; no privileged authorization
    api/                typed/validated transport contracts
    data/               cache, query bounds, pagination, schema adapters
    ui/                 accessible primitives and composed controls
    styles/             tokens, themes, motion, quality tiers
    rateLimits.js       shared usability limits; trusted enforcement remains server-side
  legacy/               temporary compatibility adapters only, never a second product
server/
  auth/                 trusted identity, role, and ownership checks
  profiles/             publish, revision, migration, and projections
  media/                upload authorization and asset metadata
  commerce/             shop policies, Stripe, orders, payouts
  analytics/            aggregation, privacy, retention, abuse controls
api/                    thin platform handlers delegating to server modules
```

This is a responsibility map, not permission to perform a one-shot directory move. Existing import paths remain valid until their consumers are migrated and verified.

## Data contracts first

Before visual editor replacement, establish versioned contracts for:

- `ProfileDocument`: owner and username identity, schema version, published revision, public pages, SEO, theme/material references, and compatibility payload.
- `ProfileDraft`: owner-scoped mutable state, base published revision, update timestamp, and recoverable edit history.
- `ProfilePage` and `ProfileBlock`: stable IDs, order, visibility, responsive layout, data, style, and accessibility fields.
- `MusicTrack` and `Playlist`: owner, source type, asset/embed metadata, artwork, duration, rights confirmation, and ordered references.
- `LyricsDocument`: stable track binding, line/stanza/word timing, offset, version, and import/export metadata.
- `MediaAsset`: owner, provider, key, MIME type, dimensions/duration, provenance, derivatives, and lifecycle state.
- `PublishProjection`: minimal public document used by public rendering and directory/ranking queries.

Every migration reader must accept legacy documents. Every v2 writer must preserve unknown legacy data until a versioned server migration has proven reversibility. Public reads must not depend on private draft documents.

## Current-to-target mapping

| Current source / behavior | Target responsibility | Migration action | Parity and rollback gate |
| --- | --- | --- | --- |
| `src/main.jsx` → `src/redesign/App.jsx` | `src/app` host/router composition | Keep active while routes are moved behind stable page components. Add multipage profile routing without stealing reserved routes. | Route matrix, auth redirects, hostname tests, and a switch back to the current router. |
| `src/redesign/index.css` and component-local styles | `src/shared/styles` and `src/shared/ui` | Extract tokens first, then primitives, with visual snapshots and no bulk restyle. | Desktop/mobile screenshots, focus/contrast checks, reduced-motion proof. |
| `src/redesign/lib/profileModel.js` and `src/shared/profileSchema.js` | versioned profile compatibility layer | Create lossless read/write adapters and fixtures before expanding the schema. | Byte/semantic round trips for every fixture; old renderer fallback; export backup. |
| `src/redesign/lib/profileStore.js` | profile repository and publish service | Split draft save from publish, serialize writes, skip unchanged documents, add revision conflicts, replace unnecessary public listeners with cached reads. | Emulator tests for ownership/conflict/offline/retry; current published document remains restorable. |
| tabbed dashboard editor | `features/studio` shell, pages/layers/canvas/inspector | Introduce a v2 Studio route behind founder access, reuse current controls through adapters, then migrate feature panels one at a time. | Existing profile edits remain reachable; per-panel parity checklist; no public default switch. |
| single-page profile renderer | `features/profiles` page/block renderer | Add version-aware rendering and `/:username/:page`; preserve legacy renderer for schema-v1 profiles. | Fixture screenshots, mobile/desktop/a11y tests, reserved-route collision tests. |
| `AudioTab`, `StreamingPlayer`, profile audio card | `features/music` library, playlists, player and embeds | Wrap current single-track model as a one-item library, then add multi-track documents and global player state. | Uploaded audio and every existing official embed still play; no automatic copyrighted demo reuse. |
| `LyricsTab` and `src/redesign/lib/lyrics.js` | `features/lyrics` document/editor/renderer | Preserve current line sync and LRC behavior, add revisioned track binding, then stanza/word timing, zoom, offsets, and handles. | Existing lyrics tests plus import/export round trips, drag/tap keyboard/mobile tests, public sync proof. |
| `src/data/mediaStore.js`, Blob/R2 APIs, legacy Storage | `features/media` + trusted media server | Normalize asset metadata and ownership while supporting both legacy URLs and current providers. | Upload/list/delete ownership tests, orphan policy, legacy URL rendering, provenance inventory. |
| directory/explore and `server/topProfiles.js` | discovery projections and maintained ranking aggregates | Replace per-profile count reads with maintained/batched aggregates; add cache TTL, pagination, and visible errors. | Query-count budget, empty/error distinction, deterministic ranking, fallback to current endpoint. |
| analytics stores and visitor aggregation | privacy-aware analytics service | Define events, retention, aggregation, sampling/abuse controls, and owner views without per-navigation quota reads. | Rules/server tests, consent/privacy review, bounded queries, deletion/export behavior. |
| Discord/TikTok cards and inactive legacy blocks | `features/profiles/blocks` widget registry | Define block manifests, permissions, fallback UI, load behavior, and accessible controls. | Every existing widget fixture renders; unavailable APIs fail visibly and safely. |
| preset/badge stores | compatible preset registry | Version presets by supported blocks/materials and distinguish exact/approximate/fallback rendering. | Independent apply/reset, mobile preview, compatibility labels, no user-data overwrite. |
| help centre/staff tools | `features/help` and trusted staff APIs | Preserve host isolation, paginate live collections, move staff authorization to trusted roles. | Role/rules tests, listener cleanup, old tickets/messages remain reachable. |
| disabled Business Mode | isolated optional feature | Keep disabled and documented while extracting shared primitives only where beneficial. | No route or entitlement activation; existing data untouched. |
| `ShopHost`, shop APIs, `server/shopPolicy.js` | `features/shop` and `server/commerce` | Preserve the isolated test-only product. Reuse shared UI incrementally without changing commerce flags. | Full shop tests, Stripe test-mode assertion, idempotent webhooks, protected-host proof. |
| profile Premium/vanity concepts | free profile/domain capability plus separate shop billing | Inventory entitlements and billing records, remove profile-feature locks, preserve legitimate shop subscriptions and records. | No user loses paid-shop data; profile capabilities are free; no new charge can be created accidentally. |
| hard-coded founder email lists | trusted role/claim service | Introduce server-issued roles and compatible transition checks, then remove client authority. | Emulator/rules/API matrix for owner, founder, moderator, support, and anonymous users. |

## Write path and publish model

The target profile write sequence is:

```text
local edit
  -> debounced normalized draft patch
  -> unchanged-write check
  -> one serialized owner-authorized draft write
  -> explicit publish request with base revision
  -> trusted validation and conflict check
  -> immutable/recoverable revision
  -> public projection + directory projection update
  -> short-lived public cache invalidation
```

Realtime listeners are reserved for genuinely collaborative or conversational state. Public pages, directory cards, presets, and other slowly changing public data use bounded one-time reads with an explicit short cache period. Conversation/message listeners remain realtime but must be bounded and paginated, with every React effect returning its unsubscribe function.

## Migration gates

Each stage is complete only when all applicable gates pass:

1. Behavior: the stage acceptance criteria and legacy parity fixtures pass.
2. Data: reads are bounded; writes are authorized, deduplicated where possible, and backward compatible.
3. Accessibility: keyboard operation, focus visibility, labels, contrast, reduced motion, and media alternatives are checked.
4. Performance: bundle and interaction impact is measured against an explicit budget, including low-power quality behavior.
5. Security: ownership and roles are enforced by trusted server code or Firebase rules, not client state.
6. Commerce: test mode and closed feature flags are re-verified when a change touches shop or Stripe paths.
7. Recovery: rollback does not require deleting or destructively rewriting production user data.
8. Documentation: `docs/UPET_STUDIO_PROGRESS.md`, tests, known gaps, and the next exact task are updated.

## Staged execution order

| Stage | Deliverable | Release posture |
| --- | --- | --- |
| 0 | Repository/data audit, migration map, progress ledger | Local only |
| 1 | Shared tokens and accessible primitives without functional redesign | Local only |
| 2 | Profile schemas, lossless legacy adapters and shared renderer foundations | Local only |
| 3 | Graphics quality manager and shared renderer lifecycle | Local only |
| 4 | Complete material/effect engine in Sections 5–7 | Local only |
| 5 | Complete background/effect catalogue in Sections 6–7 | Local only |
| 6 | Studio canvas/inspector, responsive authoring, history, draft/publish and security | Local/emulator; founder gate |
| 7 | Multi-page layouts and navigation | Local; deep-link/back/forward/mobile proof |
| 8 | Music migration, playlists/skins/analysis and complete waveform/synced lyrics parity | Local/emulator |
| 9 | Galleries, collections and user content widgets | Local/emulator |
| 10 | Authorized external social integrations | Local with explicit unavailable states |
| 11 | Guestbook, polls, reactions and donor badges | Local/emulator |
| 12 | Analytics, link enhancements, SEO/sharing | Local/emulator |
| 13 | 50+ presets, theme scheduling and backups | Local/emulator |
| 14 | Original homepage using actual shared demos | Local only |
| 15 | Free vanity subdomains / optional BYOD | Local plus infrastructure verification |
| 16 | Safe legacy cleanup and dead-code removal | Reviewable deletions only after parity |
| 17 | Comprehensive quality/security/performance and shop/help/business regression pass | Release candidate |
| 18 | Protected founder preview release | Verified access control, public site unaffected |
| 19 | Public launch | Only after explicit user approval |

This table was corrected on 2026-10-26 to match Section 23 of the final masterplan exactly. The earlier table incorrectly substituted an internal feature sequence. Earlier draft/publish, editor and graphics commits remain useful groundwork, but cannot count as completion of differently scoped final stages. A stage can have several commits; finish and verify all its acceptance criteria before advancing. Preserve the trusted draft/publish/security foundation while implementing the earlier graphics stages.

## Deletion protocol

No legacy file is obsolete merely because a v2 replacement exists. Before deletion, record:

- all imports, dynamic references, routes, jobs, rules, indexes, documentation, and deployed handlers that refer to it;
- the replacement and its parity evidence;
- production data or URLs that still depend on it;
- the rollback path and last compatible release;
- the exact removed files in `docs/UPET_REMOVED_FILES.md`.

User records, media, usernames, revisions, commerce records, Stripe identifiers, and support history are never cleanup targets. Their migrations require versioned, reversible scripts and dry-run evidence.
