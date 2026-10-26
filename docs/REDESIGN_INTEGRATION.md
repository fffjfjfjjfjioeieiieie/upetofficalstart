# Frontend redesign integration

The returned `userpet-source.zip` frontend is mounted from `src/redesign`. The original frontend remains in `src/app`, `src/dashboard`, `src/studio`, and `src/profiles` as a migration reference.

## Production services retained

- Firebase Authentication remains the only login system. The browser-only demo users and hardcoded admin password from the returned frontend were removed.
- The approved founder email list remains in `src/app/FounderGate.jsx` and `firestore.rules`.
- Claimed usernames continue to use the existing transactional `users` and `usernames` documents.
- Existing version 1 profile documents remain readable. New redesign state is sanitized and stored in `published.redesign` alongside a compatible version 1 document.
- Profile media can use Cloudflare R2 with per-user, short-lived signed uploads. Existing Vercel Blob files remain readable and manageable; R2 is used for new uploads after all `R2_*` server variables are configured. Without those variables, uploads continue through Vercel Blob.
- Uploaded objects remain grouped under `profiles/{uid}/`, retain the existing size/type limits, and can only be listed or deleted by their Firebase owner.
- Profile views continue to use `profileEvents`.
- A public `directoryProfiles` projection supports Explore without exposing private account documents. Historical commerce metadata remains compatible, but no shop UI or checkout is shipped.

## Frontend behavior

- Signed-out visitors see the unavailable message, Discord link, theme control, and admin login.
- Approved users sign in with email and password. Accounts without a handle are sent to `/claim`.
- Editor changes publish after a 900 ms debounce and show save state in the mobile dashboard header.
- `/dome` retains its built-in fallback if no published Firestore profile is available.
- Dashboard navigation has desktop and mobile layouts.

## Release order

1. In Cloudflare, create the R2 bucket, make its media publicly readable through an `r2.dev` address or custom domain, and create an R2 API token with Object Read & Write access limited to that bucket. Set the public base URL to the bucket's public hostname.
2. Add this bucket CORS policy so signed uploads work from the site. Replace the preview origin with the Vercel preview domain only if you need preview uploads:

```json
[
  {
    "AllowedOrigins": ["https://user.pet", "https://www.user.pet"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

3. Configure Vercel with `BLOB_READ_WRITE_TOKEN` for existing Vercel Blob media and set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and `R2_PUBLIC_BASE_URL` in Production and Preview. The media library merges existing Vercel Blob assets with new R2 assets, so saved profile URLs keep working without a bulk move.
4. Review and deploy `firestore.rules` if the current production rules do not yet allow `directoryProfiles` reads and owner writes.
5. Build, smoke-test uploads and public profiles, then deploy the frontend and API. Existing Vercel Blob links keep working.

No deployment was performed during this integration.
