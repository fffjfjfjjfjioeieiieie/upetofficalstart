# UPET v2 publish and public-data security

Date: 2026-10-25

Status: Stage 3 domain foundation; not connected to Firestore or a public endpoint

Stage 3 separates canonical owner data from public data and defines the transaction decisions that a trusted server adapter must enforce. The current production save path is unchanged.

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

Stage 3 still needs a separate strict public lyrics projection before lyrics documents can be exposed directly.

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

The repository is deliberately dependency-injected and has no route binding. Its fake-transaction tests verify write targets, stale conflicts, missing references, cross-owner references, reference limits, unchanged-write suppression and invalidation behavior. Firebase emulator/rules tests remain mandatory before it can be connected.

## Trusted roles

`server/v2/authClaims.js` recognizes only server-verified token claims: founder, admin, moderator and support. Email addresses do not grant a role. A staff claim also does not replace profile ownership; publishing remains owner-only unless a separately reviewed recovery/moderation operation is designed.

This module does not yet replace the hard-coded email checks in the current rules/server code. That transition requires compatible custom claims, token refresh behavior, rules tests and a founder recovery plan.

## Read cost and cache policy

`createPublicRequestCache` shares identical in-flight and successful public requests for an explicit 30-second TTL, with a 500-entry default maximum. Rejected loaders are evicted and their errors propagate; backend failures are not converted into empty results.

`QUERY_LIMITS` defines bounded defaults and maximums for directory profiles, conversations, messages, support tickets, ticket messages, revisions and analytics events. Every older-record workflow still needs a concrete cursor implementation in its repository adapter and UI.

These helpers are not client quota checks and do not add Firestore reads to navigation.

## Remaining Stage 3 gates

- Test the Admin SDK repository and revision races against the Firebase emulator, then bind it only to an authenticated server route.
- Define and test strict public lyrics/media endpoints and private canonical collection paths.
- Update Firestore rules to use trusted claims/roles without breaking founder recovery.
- Add bounded cursors to each current unbounded listener and preserve every unsubscribe cleanup.
- Replace the top-profile N+1 count path with maintained aggregate documents.
- Connect the public cache to one server endpoint and verify invalidation after publish.
- Keep the current v1 writer active until v2 migration and rollback gates pass.
