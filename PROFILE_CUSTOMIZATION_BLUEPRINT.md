# user.pet profile customization blueprint

Updated: 2026-10-14

This document records the runtime evidence, product decisions, implemented profile controls, and next expansion points for the user.pet account and profile system. It is meant to keep future work consistent without copying another site's visual identity.

## Runtime evidence collected with REA

REA 6.4.0 captured rendered DOM, accessibility trees, URLs, and screenshots in owned Chromium sessions. Each final artifact was complete. REA reported `cleanup_incomplete` because it could not confirm browser cleanup inside its one-second cleanup window; the captured step artifacts remain usable. No credentials were entered, so authenticated competitor dashboards remain unobserved.

### Claim and login flow

- `https://guns.lol/register` begins with one public-path decision: a `guns.lol/username` field and Continue button. Supporting copy frames the result as a customizable profile with links.
- `https://guns.lol/login` uses email, password, one primary login action, provider alternatives, recovery, and a registration path.
- Evidence anchors:
  - Register DOM SHA-256: `a159a637b87b179660d3a96a98a0987b88fe9b16ca77951e344b1abfac43b9c2`
  - Register accessibility SHA-256: `e2ab995994e4f110c67d36660be37346dae486859bca7f1c605c1fb386f97d02`
  - Login DOM SHA-256: `49922d98d5f97e6360e619d0390f8e5b22bdf904a5416da3c7faeb0cd1405c79`
  - Login accessibility SHA-256: `9cbde2489063dfab2efe9ba60ffc01e88e4d6f84b947ef9be270f850713a482d`

### Customization surface

The official customization page observed by REA lists background images and videos, avatar, audio manager, custom cursor, description, Discord presence, background and username effects, panel opacity and blur, location, glow, accent/background/text/icon colors, profile gradients, monochrome icons, animated browser title, swapped box colors, volume control, Discord avatar, and avatar decoration.

The documentation navigation also exposes separate areas for profile analytics, badges, templates, views, second tabs, layouts, metadata/SEO, fonts, and typewriter descriptions.

- Customization DOM SHA-256: `3a42aa61ab8004d4f2122ba73cfea3710094f0d60ec2d5b0568acac20e6f2a58`
- Customization accessibility SHA-256: `87a45817dba76d3608b7d5f6b18be1acc2b2b607b8cb7a5504481112440c1862`

## What is observation, inference, and product choice

Observed: the public registration first step, login controls, documentation categories, public profile entrance behavior, media playback, and responsive profile structure.

Inferred: a staged flow of identity claim, authentication, dashboard, customization, preview, and publish is a sensible system structure. The competitor's private data model, save API, validation rules, editor layout, and authenticated transitions were not observed.

Product choice: user.pet currently keeps claiming and editing behind the three approved founder accounts. The public homepage remains a coming-soon preview. This intentionally differs from the public registration flow observed elsewhere.

## Current user.pet flow

1. A visitor sees the public coming-soon homepage, Discord action, profile showcase, theme control, and Admin login.
2. Only approved founder emails can complete login.
3. A logged-in founder without a handle can claim one.
4. A founder with a handle enters the dashboard, opens Profile Studio, edits with a live preview, saves, and visits `user.pet/{username}`.
5. `/dome` is owned by the Firebase account for `zurihcs@gmail.com` and acts as the feature-lab preset.

## Implemented controls

### Identity

- Display name, handle, bio, location, live status, avatar, and up to six text badges.
- Circle, squircle, and square avatar treatments.
- Optional banner with a layered avatar treatment.
- Normal, glow, and animated-gradient username treatments.
- Optional typewriter bio and animated browser title.

### Layout and surface

- Centered, spotlight, and minimal layouts.
- Adjustable card width, opacity, blur, corner radius, surface color, and text color.
- Separate primary accent, secondary accent, and visualizer colors.
- Multiple font families using safe local fallbacks.

### Media

- Drag-and-drop image/video background, avatar, banner, custom cursor, and profile audio.
- Track title and artist metadata.
- Play/pause, looping playback, volume control, and configurable visualizer color.
- Click-to-enter screen so browser autoplay rules are handled through a user gesture.

### Effects

- Soft glow, stars, aurora, and cyber-grid backgrounds.
- Animated dual-color card accent, film grain, ambient color orbs, 3D pointer tilt, custom cursor, entrance animation, and reduced-motion fallbacks.
- Touch devices automatically retain a normal cursor and mobile layout.

### Links and safety

- Up to eight link buttons with labels.
- Public rendering accepts only `http:` and `https:` destinations.
- Public profile documents omit account email addresses.
- Owners alone may save their profile document and upload under their Firebase UID.

## Dome feature-lab preset

`/dome` currently exercises the spotlight layout, squircle avatar, Lucid Dreams audio, pink/purple animated gradient, aurora background, grain, status capsule, badges, links, typewriter bio, animated title, and pointer tilt. Dome should remain the first place to test a new renderer feature before exposing its control to every profile.

## Next expansion points

These are planned areas, not claims about an inspected private competitor dashboard:

1. Reorderable modular blocks for links, music, gallery, text, Discord, shop, and embeds.
2. Saved templates and reusable presets with reset/duplicate actions.
3. Draft versus published profile versions and undo/redo history.
4. Real profile-view analytics with privacy-safe daily aggregation.
5. Optional second tab and long-form portfolio sections.
6. Social-provider connection and Discord presence after their Firebase/provider configuration exists.
7. Custom metadata, share image, description, and profile-level SEO.
8. Audio-reactive FFT data sourced from the profile track rather than decorative animation.
9. Image crop/compression and avatar decoration controls using packages already present.
10. A block-level mobile preview switch and per-device visibility controls.

## Operational limits

- Firebase Storage must be initialized in the `upet-c480b` console before uploaded assets persist. Local object URLs are preview-only and are reverted when an upload fails.
- The site changes are local until a Vercel deployment is requested.
- REA can inspect public pages and documentation. Authenticated competitor areas remain unknown without an authorized test account.
