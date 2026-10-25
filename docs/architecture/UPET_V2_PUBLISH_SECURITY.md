# UPET v2 publish and public-data security

Date: 2026-10-25

Status: Stage 3 verified local foundation; production migration and cutover blocked

Stage 3 separates canonical owner data from public data and defines the transaction decisions that a trusted server adapter must enforce. The current production save path is unchanged. The isolated v2 API is disabled by default and founder-claim gated when enabled.

## Projection boundary

Canonical v2 profiles contain ownership, draft compatibility and migration state. They are never a public response. `createPublicProfileProjectionV2` creates a new allowlisted value that excludes:

- `ownerUid`, compatibility state and legacy snapshots;
- storage provider keys, asset provenance and private lifecycle details;
- rights evidence and private track metadata;
- editor-only block state and unknown block types;
- unapproved block data, style and theme keys;
- hidden pages and blocks.

Nested collection items for galleries, socials and skills also use allowlists. Unknown block types are omitted until they have a reviewed public projector. Referenced tracks and media assets must be supplied, active where applicable, and owned by the same account; incomplete or cross-owner projections fail closed.

The directory projection is smaller again: username, revision, display name, short bio, avatar URL, bounded badges, public accent, a trusted shop-enabled boolean and update time.

Public lyrics are copied to immutable allowlisted `profileV2PublicLyrics` documents during publish and returned only by `/api/v2-profile-lyrics` after the requested track is confirmed in the published public profile. Direct Firestore client access to private and public lyric documents is denied. Public profile reads use `/api/v2-profile-public` and a 30-second shared cache. Media exposed by the profile endpoint is the strict public media projection; no private asset library response is provided.

## Publish decision

`prepareProfilePublishV2` is a pure server-domain function. It performs no I/O and returns an atomic write plan only after it verifies:

1. the draft and canonical contracts;
2. exact owner UID authorization;
3. username consistency;
4. an enabled native-v2 write mode;
5. the draft's base published revision;
6. ownership and completeness of referenced tracks/assets;
7. public and directory projection validation.

Unchanged content returns `changed: false`, allowing the eventual repository adapter to skip every Firestore write. A changed publish increments the revision once and returns the published canonical document, strict public projection, directory projection, recoverable revision snapshot and rebased draft.

`createFirestoreProfileV2Repository` now executes that plan against isolated v2 collection names through a supplied trusted Admin SDK database. It reads the owner draft and current canonical revision inside the transaction, bounds referenced data to 100 tracks and 200 assets, reads every referenced document before writing, then atomically writes canonical, public, directory, revision and rebased-draft documents. An unchanged plan performs zero writes. Cache invalidation runs only after a changed transaction succeeds.

The repository is dependency-injected and bound only to a disabled-by-default founder preview route, `/api/v2-profile`. Its `saveDraft` action verifies the verified UID, claimed username, write mode and both optimistic revisions in one transaction, writes only `profileV2Drafts/{uid}`, and skips unchanged data. `publish` remains a separate explicit action. Fake-transaction and Firebase emulator tests verify privacy, stale conflicts, missing and cross-owner references, reference limits, unchanged-write suppression, public projection isolation and invalidation. The route returns revision metadata only; draft loading currently uses owner-only Firestore `get` under rules.

## Trusted roles

`server/v2/authClaims.js` recognizes only server-verified token claims: founder, admin, moderator and support. Email addresses do not grant a role. A staff claim also does not replace profile ownership; publishing remains owner-only unless a separately reviewed recovery/moderation operation is designed.

Current rules/server checks now use verified custom roles, not email allowlists. `scripts/migrate-founder-claims.mjs` preserves unrelated claims, defaults to dry-run and can recover a founder through an operator-supplied UID. Do not deploy the new rules or enable v2 until production claims and token refresh are coordinated; neither has been run. Emulator tests prove email alone cannot grant founder authority.

## Read cost and cache policy

`createPublicRequestCache` shares identical in-flight and successful public requests for an explicit 30-second TTL, with a 500-entry default maximum. Rejected loaders are evicted and their errors propagate; backend failures are not converted into empty results.

`QUERY_LIMITS` defines bounded defaults and maximums for directory profiles, conversations, messages, support tickets, ticket messages, revisions and analytics events. Every older-record workflow still needs a concrete cursor implementation in its repository adapter and UI.

The active conversations, support ticket/message and analytics readers now use bounded pages and older-record cursors. Firestore rules limit the relevant list shapes. These helpers are not client quota checks and do not add Firestore reads to navigation. Client-visible backend errors are surfaced where touched.

## Ranking and rollout gate

`profileRankingStats` is incremented by a trusted profile-event endpoint and read with one top-100 query plus batched profile/directory reads. A shared short-lived leaderboard snapshot prevents repeated serverless refreshes. The one-time backfill script pages legacy directory entries and skips existing aggregates; dry-run is the default. Run the backfill before any aggregate reader/event writer rollout, with a production-data backup and operator approval. No production aggregation or migration ran in this stage.

The final live cutover still requires founder custom claims on real accounts, a tested recovery UID, refreshed tokens, a ranking backfill, live-data migration/rollback rehearsal, an owner-authenticated browser check, and explicit release approval. Current v1 writes remain active to preserve users; the v2 legacy migration writer remains blocked.
