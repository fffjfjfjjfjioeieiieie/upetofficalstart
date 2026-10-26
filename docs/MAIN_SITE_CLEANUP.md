# Main-site-only cleanup — 26 October 2026

The masterplan/Studio v2 rebuild is cancelled. Continue improving the existing main website feature by feature; do not resume the removed stage plan.

## Removed

- Experimental Studio v2, Three.js materials/graphics engine, v2 profile APIs/contracts, stage harnesses, planning/quality ledgers and migration scripts.
- Shop/storefront/marketplace screens, seller chat, shop dashboard, payment/subscription server APIs and Stripe SDK integration.
- Commerce navigation, homepage advertising, shop setup help articles, retired dependency/test scripts and Stripe settings from `.env.example`.
- Generated stage previews and reference assets were moved outside the working repository into the recovery directory.

## Retained intentionally

- Existing main-site design, authentication, transactional account/username handling, profiles, editor, presets, music, waveform/lyrics editor, help, analytics and moderation.
- Historical commerce fields survive profile publication unchanged. Username-renaming compatibility still handles existing legacy records; this is not a storefront or checkout implementation.
- Retired URLs redirect to Explore, the main dashboard/editor or the corresponding public profile. Reserved names prevent retired paths being claimed as profiles.
- Existing badge grants, historical support/legal records and inactive business-application compatibility remain intact.
- Generic trusted-claim checks now live in `server/authClaims.js`; generic query policy remains shared with the main site.
- Local rules deny browser access to retired commerce collections. No Firebase rules, indexes or application changes were deployed.
- Actual environment files, Firebase/Stripe account data and stored media were not changed. Unrelated local edits remain uncommitted.

## Verified

- `npm test`: **70 passed, 0 failed**.
- `npm run build`: production build passed (6351 modules); Rollup reports non-blocking third-party annotation warnings.
- All **217** JavaScript/JSX source files parse and their relative imports resolve.
- `npm run test:main-site`: desktop/mobile homepage, retired redirects, anonymous route guard, public profile entry, Help Centre, login-form routing, live profile editing, audio playback/pause and synced LRC lyric import passed without runtime exceptions.
- Browser checks use local fixtures and intercept external/API requests. Editor saves/authentication are in-memory fixtures: real Firebase sign-in, cloud persistence and external streaming-provider playback are **not** end-to-end verified.
- The production bundle was separately checked for homepage, below-fold content and login-form rendering with external/API traffic intercepted.
- Production-build preview: `http://127.0.0.1:4173/`; Vite development preview: `http://127.0.0.1:5174/`. Restart with the commands below if the session ends.

```sh
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

No failing cleanup checks remain. Two pre-existing EOF whitespace warnings in unrelated visitor files were left intact. No production-data test was performed.

## Production update — 26 October 2026

The main-site-only build was deployed to `https://www.user.pet` as Vercel deployment `dpl_H1BApvCxbZNpq5KAjZR2nmhcxUXx`. Dark mode paints immediately by default. An old saved light preference resets once; visitors can still switch to light and keep that new choice. The live homepage, login form, theme switching and absence of shop navigation passed a browser check with backend requests intercepted. Firebase rules/data, stored files and Stripe account data were not changed.

## Recovery

- Working branch: `feature/main-site-only`.
- Recovery branch: `recovery/before-main-site-cleanup-20261026` (committed history only).
- Full pre-cleanup working-tree archive, including uncommitted work: `/home/lamp/Projects/upet-removal-recovery.mnuwbG/workspace.tar.gz`.
- The same private recovery directory holds the moved reference ZIP and generated stage previews. Removed material is recoverable; nothing was deleted from cloud storage.
