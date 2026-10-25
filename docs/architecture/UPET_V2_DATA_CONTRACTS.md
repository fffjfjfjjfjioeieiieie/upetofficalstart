# UPET v2 data contracts

Date: 2026-10-25

Status: Stage 2 contract foundation; no production writer is connected

The v2 contracts live in `src/shared/contracts`. They establish bounded, versioned structures before the Studio or public renderer begins writing new data.

## Contract set

| Contract | Version | Responsibility |
| --- | ---: | --- |
| `ProfileDocumentV2` | 2 | Owner-bound canonical profile, identity, ordered pages/blocks, theme, SEO, music/media references, revision, lifecycle and compatibility state |
| `ProfileDraftV2` | 2 | Owner/username-bound draft plus base published revision and draft revision |
| `ProfilePageV2` | 2 | Stable page ID and slug, order, navigation/visibility state, and at most 100 blocks |
| `ProfileBlockV2` | 2 | Stable block ID/type/order, desktop/mobile layout, data/style and accessibility metadata |
| `MusicTrackV2` | 1 | Upload/embed/external/legacy source, metadata, rights state, artwork and lyrics binding |
| `PlaylistV2` | 1 | Ordered track references, visibility, artwork and metadata |
| `LyricsDocumentV2` | 1 | Track-bound revision, signed global offset, stanzas, line/word timing and display settings |
| `MediaAssetV2` | 1 | Owner/provider/key/URL, type and dimensions/duration, lifecycle and provenance |

All collection sizes and user-authored strings are bounded. Unknown fields are accepted on canonical contracts so newer data can survive older compatible readers. Public projections will be a separate allowlisted contract in Stage 3; canonical documents and legacy snapshots must never be returned directly from a public endpoint.

## Legacy migration bundle

`prepareLegacyProfileMigration` recognizes three existing shapes:

- flat legacy profiles;
- schema-v1 profiles, including the current public envelope;
- profiles with the active `redesign` payload.

It produces a validated migration bundle containing a v2 profile, track library, playlists, lyrics documents and media assets. Current single-track audio becomes a one-track library. Existing lyric lines become millisecond line timings bound to that track while stable IDs, unsynced state, end times and unknown line metadata remain recoverable.

The adapter always sets:

```text
compatibility.writeMode = blocked-until-roundtrip
```

`assertProfileDocumentV2Writable` rejects that state. Nothing in Stage 2 calls the current Firestore save/publish path, so defining or parsing a contract cannot alter a user profile.

## Lossless rollback rule

Every legacy migration stores a detached compatibility snapshot. `restoreLegacyProfileSource` reconstructs the original semantic object, including unknown root, envelope, identity, block, audio, shop and future fields. Fixtures prove this for all three supported shapes.

The compatibility snapshot is migration-only state. It may contain owner IDs, unpublished settings, connected-shop metadata or future fields and therefore must stay in an owner/server-private migration record. Stage 3 must define an allowlisted public projection that excludes it.

A later migration may enable writes only when it can:

1. apply known v2 edits back onto the legacy snapshot without removing unknown fields;
2. compare a base published revision and reject conflicts;
3. save a recoverable pre-migration revision;
4. generate public and directory projections atomically or with a repairable server workflow;
5. restore the original document without destructive production-data rewriting.

## Timing units

V2 music and lyric timing uses integer milliseconds. Existing seconds-based lyric values are converted by rounding to the nearest millisecond and convert back to seconds for the compatibility renderer. Untimed lines use `startMs: null`; zero is a valid synced start. End times must be later than their corresponding start. Global offsets allow signed values up to one hour in either direction.

## Fixture coverage

`tests/fixtures/profileContracts.mjs` contains fictional, repository-local data only:

- a flat profile with links, audio and unknown nested fields;
- a schema-v1 public envelope with ordered blocks, two tracks and future settings;
- a current redesign envelope with shop metadata and line-synced lyrics.

`tests/profileContracts.test.mjs` checks validation, source classification, blocked legacy writes, lossless detached rollback, block and theme preservation, one/multi-track migration, lyric round trips, native v2 drafts and preservation of future v2 fields.
