# Aggregate site statistics

The optional tracker sends only an event type (`page` or `conversion`) and a normalized route to `/api/visitor`. Browser opt-out is available at `/privacy`. The server records daily page and conversion totals and bounded route counts for up to 90 days. It does not read request IP headers, cookies, account identity, browser/device details, referrers, or geolocation. No per-visitor history or unique visitor estimate is kept.

Founders can view totals at `/dashboard/visitors`. The endpoint returns only those aggregates. The former individual visitor diagnostics, network lookup, IP display, Discord notification, and Discord lookup API have been removed. `/api/visitor-admin` returns `410 Gone` for any old bot version.

The daily `/api/visitor-prune` cron removes expired aggregate rows and clears legacy diagnostic, session, claim, audit, rate-limit, and live collections. Browser clients are denied direct Firestore access in `firestore.rules`. Deploy changed rules with `firebase deploy --only firestore:rules`.

The `discord-bot` source now has no user.pet API requests or visitor command handlers. Run `npm run deploy-commands` in that directory with the Discord bot credentials to remove old guild slash commands. Deploy the idle bot version to its existing host or stop that process. Rotate the previously exposed bot token.

Run `npm run test:visitor` and `npm run build` at the project root. The site deployment and Firebase rules deployment are separate operations.
