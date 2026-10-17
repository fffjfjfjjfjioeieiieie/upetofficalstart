# Frontend redesign integration

The returned `userpet-source.zip` frontend is mounted from `src/redesign`. The original frontend remains in `src/app`, `src/dashboard`, `src/studio`, and `src/profiles` as a migration reference.

## Production services retained

- Firebase Authentication remains the only login system. The browser-only demo users and hardcoded admin password from the returned frontend were removed.
- The approved founder email list remains in `src/app/FounderGate.jsx` and `firestore.rules`.
- Claimed usernames continue to use the existing transactional `users` and `usernames` documents.
- Existing version 1 profile documents remain readable. New redesign state is sanitized and stored in `published.redesign` alongside a compatible version 1 document.
- Profile media uses the public Vercel Blob store `userpet-media`. Direct browser uploads are authorized by `api/blob.js`, which verifies the current Firebase ID token and founder email before issuing a short-lived upload token.
- Blob objects remain grouped under `profiles/{uid}/`, retain the existing size/type limits, and can only be listed or deleted by their Firebase owner.
- Profile views continue to use `profileEvents`.
- A public `directoryProfiles` projection supports Explore and Marketplace without exposing private account documents. Its rules must be deployed with the frontend release.

## Frontend behavior

- Signed-out visitors see the unavailable message, Discord link, theme control, and admin login.
- Approved users sign in with email and password. Accounts without a handle are sent to `/claim`.
- Editor changes publish after a 900 ms debounce and show save state in the mobile dashboard header.
- `/dome` retains its built-in fallback if no published Firestore profile is available.
- Dashboard navigation has desktop and mobile layouts.

## Release order

1. Review and deploy `firestore.rules` so `directoryProfiles` reads and owner writes are available.
2. Confirm the Vercel project has the `BLOB_READ_WRITE_TOKEN` created by its linked `userpet-media` store.
3. Build the Vite app with the existing production Firebase environment variables.
4. Smoke-test login, claim, editor save, Blob upload, public profile, Explore, and Marketplace.
5. Deploy the frontend only after approval.

No deployment was performed during this integration.
