# UPET v2 visual baseline

Captured: 2026-10-25

Stage: 1 — shared tokens and primitives

Environment: local Vite server, headless Chromium

Deployment: none

This baseline protects the current public presentation while the v2 foundations are extracted. It deliberately avoids production profile reads and authenticated account mutation.

## Routes and viewports

The following states were captured before and after the Stage 1 extraction:

- anonymous `/` at 1440 × 1000;
- anonymous `/` at 390 × 844;
- every one of the six homepage sections captured individually so `content-visibility: auto` did not omit off-screen content;
- `/dashboard` at both viewports, resolving to `/login?next=/dashboard` as expected for an anonymous visitor.

The local Vite server does not execute the Vercel `/api/top-profiles` handler, so the homepage's three featured-profile cards render their intentional placeholders and one expected 404 appears in the browser console. This is an environment limitation, not evidence that the deployed endpoint is healthy. No production read was introduced to bypass it.

An authenticated Studio capture was not possible without signing in or manufacturing account state. Source/layout inventory covers that surface for Stage 0; a real founder test account and an isolated emulator/preview environment are required before the Studio visual baseline can be completed.

## Comparison result

- 13 of 14 before/after PNG captures were byte-identical.
- The remaining desktop hero capture was visually identical on inspection; its binary output differed due to render timing/antialiasing.
- Homepage landmarks remained one `main` and one `h1`.
- The anonymous homepage had no link, button, input, select, or textarea without an accessible name under the smoke-test heuristic.
- Initial keyboard Tab focus remained the home-logo link.
- Dark-theme compatibility aliases resolved to the same HSL channels after token extraction.
- With Chromium emulating `prefers-reduced-motion: reduce`, the shared base motion token resolves to `1ms`.

## Stage 1 intentional differences

The shared `Button` now defaults native buttons to `type="button"`, preventing accidental form submission. An explicit `type="submit"` remains supported, and `asChild` links do not receive button-only attributes. Its focus ring is two pixels with an offset instead of the previous one-pixel ring. This is an intentional accessibility improvement; inactive homepage controls do not use this component yet.

## Reproduction outline

1. Start `npm run dev -- --host 127.0.0.1 --port 4173`.
2. Confirm `http://127.0.0.1:4173/` returns successfully.
3. Use Playwright Chromium with reduced motion, capture every `main section` at 1440 × 1000 and 390 × 844, then capture `/dashboard` at both sizes.
4. Disable animations and transitions only in the capture page to make visual comparison deterministic.
5. Record expected local API limitations separately from browser/runtime failures.

Future stage baselines should add authenticated Studio, a fixture-backed public profile, lyrics/waveform, and shop test-mode views without reading or mutating production data.
