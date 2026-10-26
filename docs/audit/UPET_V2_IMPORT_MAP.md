# UPET v2 import and dependency map

Rechecked 2026-10-26 on `feature/upet-studio-v2`. This supplements the frozen Stage 0 current-state audit with reproducible import evidence. No source was deleted or moved.

## Reproduce the graph

Run `node scripts/audit-source-imports.mjs` for the summary, or add `--json` for every source module, local dependency edge and package import. The read-only scanner uses the Babel parser already installed by Vite's React plugin. It covers JS/JSX/TS/CSS in `src`, `api`, `server` and the separate Discord bot; it resolves the actual Vite `@` alias to `src/redesign` and literal dynamic imports.

The recheck found 319 source files, 672 local import edges, 154 files reachable from `src/main.jsx`, zero unresolved local imports and zero parse errors. These counts describe this checkpoint, not a future invariant. Test harnesses, static HTML asset references, CSS `url()`, deployment file inclusion, Firestore paths and remote consumers need separate checks; browser unreachability alone is never deletion evidence.

## Runtime dependency chains

| Entry / consumer | Actual dependencies and boundary | Migration decision |
| --- | --- | --- |
| `index.html` → `src/main.jsx` | `src/redesign/App.jsx`, active redesign CSS, lazy `src/help/HelpApp.jsx`; host dispatch stays at the existing entry | Keep; additive routes only |
| `src/redesign/App.jsx` | StoreProvider, main shell, lazy pages/dashboard/shop routes; `@` resolves to this tree | Keep runtime composition until route-specific parity |
| `src/redesign/lib/store.js` | Firebase Auth/account state, active profile model/store, analytics; shared app initialization | Preserve one auth session; no second provider |
| `src/redesign/pages/ProfilePage.jsx` | `firebaseStore` → public profile/grant documents → `profileModel`; `ProfileScene`, `ProfileCard`, `EntryGate` | Keep v1 default while v2 renderer is previewed |
| dashboard `Editor.jsx` | Media/Entry/Effects/Card/Links/Audio/Lyrics panels and `EditorPreview` → current ProfileCard | Replace only after every panel has parity |
| `AudioTab.jsx`, `LyricsTab.jsx`, `ProfileCard.jsx` | Existing media uploads, official embeds, WaveSurfer lazy import, shared lyric utilities and current seconds-based line data | Protected compatibility boundary; Stage 8 fixtures before refactoring |
| `src/features/studio/v2/StudioV2Route.jsx` | Preview flag and refreshed founder token → private draft read → StudioV2 | Additive founder route; existing editor remains reachable |
| `StudioV2.jsx` | Canonical contracts, shared ProfileRenderer, existing EditableCanvasItem, dnd-kit, serialized draft coordinator, explicit v2 API | Reuse components; no parallel preview renderer |
| `api/v2-profile.js` | Trusted Firebase identity/roles → `server/v2` repository/publish/projections/cache | Disabled by default; no direct privileged client writes |
| `src/features/profiles/renderer` | Strict public projection or owner canonical schema, shared HTML block content, MaterialSurface | Native v2 foundation; unsupported blocks retain owner fallback |
| shared UI consumers | Active `components/ui/button.jsx` re-exports shared Button; controls use existing Radix slider/switch/dialog; CSS imports shared tokens | Reuse functioning primitives; do not activate unused wrappers |
| `src/redesign/shop/ShopHost.jsx` and shop APIs | Existing shop policy/auth/models, server commerce/Stripe/webhook handlers | Keep isolated test-only commerce and its flags |
| help host / `/help-preview` | Existing help router/auth/store and trusted staff checks | Preserve host isolation and ticket history |
| `api/*` → `server/*` | Platform handlers, Firebase Admin/server credentials, Stripe, media and visitor services | Keep server-only modules outside browser imports |
| `discord-bot/src/index.js` | Separate `discord-bot/package.json` and its own node_modules | Separate runtime; browser graph is irrelevant to its retirement |

## Package findings and source classification

The complete graph records package imports. The active production build verifies its browser dependency resolution. React, React Router, Vite, Firebase, dnd-kit, WaveSurfer, Radix, Motion and Stripe remain the existing stack. The Discord bot resolves its dependencies from its own package root. Import-only ESM packages such as `@fft-visualizer/react` are installed and must not be misclassified by a CommonJS-only resolver.

Seventeen package references remain unresolved in the source inventory: React Query in inactive `src/redesign/index.js`, and sixteen inactive UI wrappers (alert-dialog, aspect-ratio, calendar, command, context-menu, drawer, hover-card, input-otp, menubar, navigation-menu, progress, radio-group, sonner, toast, toggle-group and toggle). Their missing packages are listed by the scanner. They are outside the active browser graph and are **quarantined**, not ready-to-reuse primitives. Do not install a large unused dependency set or activate those files by accident. Review them during Stage 16 with reference evidence.

Classification:

- **Keep:** active auth/Firebase bootstrap, shop/Stripe isolation, current upload/player/lyrics paths, shared utilities and required deployment configuration.
- **Refactor incrementally:** runtime route composition, shared tokens/controls, bounded profile/discovery reads, versioned draft/publish services.
- **Replace only after parity:** current editor and public profile presentation, lyrics/waveform interactions, feature panels and existing profile data formats.
- **Quarantine:** inactive `src/redesign/index.js` and unresolved unused UI wrappers; dormant legacy/demo modules remain present pending consumer/provenance review.
- **Delete only after proven unused:** no file is approved for deletion by this checkpoint. Stage 16 requires the removal-candidate and removed-file ledgers, essential regression checks and rollback evidence.

## Rollback and external unknowns

The original runtime entry, schema-v1 profile path and legacy editor remain available. The new renderer can be reverted without rewriting user data. Existing migration bundles retain detached source snapshots and block legacy writes. The v2 API defaults closed. Claim/backfill scripts have not run against production.

The current-state audit's remote unknowns remain explicit release gates: GitHub main protection, Vercel preview protection, deployed rule versions, external DNS and OAuth configuration. They do not justify destructive local changes or an automatic public deployment. Local preview remains the authorized release surface for unfinished stages.
