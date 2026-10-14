# Profile design reference for user.pet

Researched 2026-10-13 and updated with REA runtime captures on 2026-10-14. The user asked to study and remember how guns.lol and similar sites look, feel, and work. This file is durable project context for future profile/dashboard work.

## Evidence and limits

- Opened three real guns.lol profiles in headless Chromium, entered their splash screens, inspected rendered screenshots and media state, and checked desktop 1440x1000 and mobile-size 390x844 viewports. These are browser viewport checks, not physical phone testing.
- Read guns.lol's official customization, audio, layout, and changelog documentation.
- Read fakecrime's official homepage and indexed public profile content. Live browser access hit a security verification page; actual interactions and mobile behavior remain unverified.
- Read E-Z.bio's homepage and indexed entrance text. Its live profile hit Cloudflare verification. Do not claim its post-entry layout or player was tested.
- Visually inspected Linktree's official template gallery and read its Artemis template description. Did not test a logged-in editor or purchase any products.
- Used REA 6.4.0 browser scenarios at a 390x844 viewport to capture the current guns.lol login and first registration step. Both captures retained complete final DOM and accessibility artifacts, though REA reported that its owned Chromium cleanup could not be confirmed within the one-second cleanup window. No credentials were entered, so authenticated dashboard behavior remains unobserved.
- Competitor content and feature availability can change. Recheck before using this as a current entitlement/pricing specification.

## Main design lesson

My synthesis: the expressive profile sites make the person and their chosen atmosphere the main content. Background imagery, a recognizable avatar, name treatment, badges, and music establish identity before a visitor follows a link. The page feels personal because those elements share a visual theme. Linktree's gallery provides a useful comparison for obvious, readable actions.

For user.pet, keep personal expression central and make commerce an optional extension of the profile. This is a proposed direction informed by the user's existing project vision, not a new approved implementation scope.

## Guns.lol: observed profiles

### Compact example

[guns.lol/palestine](https://guns.lol/palestine) displayed an avatar beside the name, a compact badge capsule, a short description, and a small views/location row. A dark panel separated the content from moving imagery. The volume control occupied the upper-left corner. On the narrow viewport, badges moved below the name and the card retained side margins. The document was 390px wide and 844px tall: no horizontal overflow or additional vertical document height in this sample. After entry, a looping video was playing with sound enabled. This is one user's configuration, not a universal template or recommended default volume.

### Portfolio examples

[guns.lol/$](https://guns.lol/$) had a centered, spacious identity section: circular avatar, glowing name, badge pill, rotating description, and social icons. Desktop navigation dots and a scroll cue indicated more content. Subsequent sections included biography, widgets, skills, music, and projects. At 390px wide, the page remained 390px wide but extended to about 3810px tall. Its audio element was playing and looping after entry.

[guns.lol/stripesvr](https://guns.lol/stripesvr) also used a portfolio structure, with biography, social/community widgets, and a project section. At 390px wide its document extended to about 2856px without horizontal overflow. After entry, background video played muted and a separate looping audio element played unmuted. These measurements are snapshots, not design requirements.

### Documented customization

The [official customization guide](https://help.guns.lol/getting-started/customization) documents image/video backgrounds, avatars, audio, cursors, descriptions, Discord presence, background and username effects, panel opacity/blur, location, glow, colors, gradients, and options for icons and Discord avatar decorations. This supports treating appearance as several coordinated settings rather than one theme color.

The [layout guide](https://help.guns.lol/premium-guides/layout-settings) describes Default, Modern, Simplistic, and Sleek variants. Depending on the layout, settings cover banners, borders, radii, extra widgets, or custom buttons. Layout choice changes structure as well as decoration.

The [audio guide](https://help.guns.lol/how-to-guides/profile-audio) describes uploading tracks with a title and optional cover, then enabling a visible player separately. Sound selection and player visibility are distinct options.

The [changelog](https://help.guns.lol/changelog) adds context beyond the layout guide: a Portfolio layout with modules, animated borders, timezone and weather/widget options, and customizable entrance content. Documentation pages are not always updated together; do not assume the older layout guide lists every current option.

### Login and registration flow observed with REA

The mobile login page uses one focused card with email and password fields, a primary Log in action, Google and Discord alternatives, account recovery, and a path to registration. Its copy tells users what they regain access to instead of presenting an admin-only gate.

Registration begins with the public identity: a single `guns.lol/username` field and a disabled Continue button until the first step is valid. The supporting copy promises a profile, links, and customization. This confirms a useful onboarding order for user.pet: claim the public path first, then create or connect the account, then enter the profile studio.

The REA captures observed only unauthenticated screens. Dashboard structure, provider callbacks, validation responses, and post-login transitions remain unknown from runtime evidence; the implementation should not claim to reproduce those internals.

## Other references

### Fakecrime

The [official homepage](https://fakecrime.bio/) advertises Markdown descriptions, color/font/cursor choices, avatars, banners, image/GIF/video backgrounds, music, social links, and Discord presence. The emphasis overlaps with guns.lol: media, identity, and community integrations.

The indexed [Mxrc profile](https://fakecrime.bio/Mxrc) shows an entrance prompt, banner/avatar, badge labels, biography, location/timezone, social destinations, a track with time indicators, and UID. That supports a layered profile composition. It does not establish the actual animations, spacing, or mobile experience; live inspection was blocked.

### E-Z.bio

The [homepage](https://e-z.bio/) presents setup as a progression: introduce yourself, add socials, personalize colors/background, then explore other customization. The indexed [az profile](https://e-z.bio/az) exposes an entrance prompt. The useful confirmed lesson is the simple onboarding order. Further visual and interaction conclusions need an accessible live example.

### Linktree

The [template gallery](https://linktr.ee/s/templates) visually shows avatars, short introductory text, vertically stacked labeled buttons, and grouped social icons, with different backgrounds and colors. The [Artemis template](https://linktr.ee/s/template/artemis-template) is organized around business destinations such as menus and locations. My takeaway is action clarity: a visitor should immediately recognize what a button will open, even when the surrounding page is highly customized.

## Proposed user.pet design principles

These are our design recommendations, not claims about competitor implementation:

1. Give each profile a clear hierarchy: background, optional banner, avatar/name/badges, bio, socials, optional widgets/music, then an optional Shop action.
2. Use a shared profile data model and a small set of layout renderers. Preserve Lamp, Dome, and Sadlizze as visual presets instead of generating new component files for each user.
3. Separate page background, card surface, border, text, accent, and effect controls. A translucent card should still have enough contrast against its background.
4. Make media entrance optional. If enabled, support both keyboard and touch, and handle playback failure by leaving an obvious play control. Keep mute/pause accessible. Preserve the existing single-active-audio behavior in the multi-profile showcase.
5. Animate details deliberately: name treatment, a restrained glow, a subtle entrance, or background motion. Avoid stacking every effect at maximum intensity. Include reduced-motion and static background options.
6. Let badges explain themselves on focus/tap as well as hover. Keep names readable when badges wrap; use secondary styling for counts and IDs.
7. Treat mobile as a real layout: wrap rows, keep tap targets usable, contain backgrounds, and avoid shrinking an entire full profile until its text becomes tiny.
8. Keep the coming-soon homepage's no-scroll mobile requirement separate from full public profiles. A longer biography or several widgets may need normal vertical scrolling. Do not clip actual profile content to enforce a showcase-only constraint.
9. Build customization around an immediate preview with desktop/mobile switches. Suggested sections: Identity, Appearance, Links, Music, Widgets, Effects, and optional Shop. Make save state and upload errors visible.
10. Keep missing integrations quiet and useful. An unavailable Discord presence should not dominate someone's profile with a large error panel.

## Connection to the existing code

- Existing profile variants live under `src/profiles/lamp`, `src/profiles/dome`, and `src/profiles/sadlizze`; reuse them when appropriate.
- `src/shared/ProfileIdentity.jsx` already centralizes some identity markup.
- `src/shared/profileData.js` currently contains a small static Lamp object; a future generalized schema would need identity, media, appearance, links, widgets, and layout settings.
- `src/shared/profileAudio.js` pauses other marked profile media when a track starts. Preserve this behavior in the homepage preview.
- A future editor should distinguish a draft preview from saved public data and ensure controls correspond to renderer capabilities. This is a suggested implementation strategy, not an inspected competitor backend architecture.

## Session constraints to preserve

- The user has since authorized the account, public profile, and customization implementation. Deployment remains a separate action.
- Keep local preview/hosting off unless the user requests otherwise.
- Keep Shop actions disabled under the current user instructions.
- Do not reset Firestore or alter login accounts for research.
- Use this file as the remembered reference for later profile work. Do not claim permanent model memory; the durable record is this project file.
