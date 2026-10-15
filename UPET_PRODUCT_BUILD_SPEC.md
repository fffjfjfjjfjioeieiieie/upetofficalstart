# user.pet product and profile-studio build specification

Status: implementation handoff  
Written: 2026-10-15  
Audience: the coding model continuing this repository

## 1. Mission

Turn the current user.pet prototype into a polished founder-only account and profile-building product. Keep the existing public landing page's atmosphere and existing public profile identity. Rebuild the authenticated experience around a coherent dashboard and a powerful profile studio.

The product should feel deliberate, dark, tactile, and personal. It may learn from the workflows of guns.lol, swats.bio, Fakecrime, E-Z, Linktree, and Beacons. It must use user.pet's own layouts, visual language, writing, assets, and code.

The primary promise is:

> Build a profile that can look almost unlike any other user.pet profile, while keeping the editor understandable.

This document is the controlling implementation brief. Read it before changing code.

## 2. Non-negotiable product rules

1. Preserve the current public home page's overall feel. Do not replace it with a generic SaaS landing page.
2. A signed-out visitor sees the landing page, theme toggle, Discord call to action, and **Admin login**. They do not see username claiming, dashboard controls, or editing controls.
3. Username claiming appears only after an approved founder signs in.
4. Approved founder emails are:
   - `zurihcs@gmail.com`
   - `lampjustlamp123@gmail.com`
   - `iamjayvonlol@gmail.com`
5. `/dome` remains the public profile owned by `zurihcs@gmail.com`. Preserve the ownership connection through the UID/account record rather than relying only on the email at render time.
6. Remove the friends feature completely: no navigation item, route, page, store calls, Firestore collections/rules written for it, copy, or placeholder.
7. Shop controls can remain visible where the design calls for them, but they remain disabled and must not navigate or purchase yet.
8. Public profile URLs use `user.pet/{username}`. The profile studio must offer a working **View profile** action that opens that exact route.
9. Do not expose passwords in frontend source, Firestore, documentation, or version control. Authentication remains Firebase Authentication.
10. Do not deploy or start a development server unless the user asks.
11. Do not reset Firebase Authentication accounts. The standing database reset instruction applies to live Firestore data before requested product changes, while preserving Auth accounts. Treat that as a destructive operation requiring careful execution against the intended Firebase project.
12. Use focused dependencies that support a real feature. Do not add a package merely because it exists in an earlier wishlist.

## 3. Evidence and research boundaries

This specification separates direct observations from product recommendations. Static bundle findings show strings and structures present in downloaded JavaScript; they do not prove that every feature executes or is available to every account.

### Evidence ledger

| ID | Target and method | Direct observation | Limit |
|---|---|---|---|
| E01 | guns.lol mobile register, runtime accessibility/DOM capture | A single centered card starts with username, shows a fixed `guns.lol/` prefix, disables Continue until valid, and links to sign-in. | Signed-out flow only. |
| E02 | guns.lol mobile login, runtime accessibility/DOM capture | Centered login card; email and password; primary login; Google and Discord alternatives; recovery and account creation links. | Signed-out flow only. |
| E03 | guns.lol customization help, runtime capture | Asset upload areas cover background image/video, avatar, audio, and cursor. Controls include bio, Discord presence, effects, opacity, blur, location, glow, colors, gradients, title behavior, volume, and avatar decorations. | Documentation describes capabilities; it does not expose the authenticated editor implementation. |
| E04 | guns.lol register bundle, REA `ev_03d473817a7103d861b8d24f8d21aaebbd31fdffbf7aaa46184092c4b6b8ccce` | 21 of 21 observed scripts parsed with no parse failures; claim/ref/return parameters and telemetry/ping strings were present. | Partial static analysis. String-built routes and server behavior can remain unknown. |
| E05 | guns.lol login bundle, REA `ev_ef29e51d39ee7d7487617a6a11017081a828b9268093a412a0b032698d9832ab` | 24 of 24 observed scripts parsed with no parse failures; return URI and resend/auth-related strings were present. | Partial static analysis; no authenticated behavior was executed. |
| E06 | guns.lol documentation bundle, REA `ev_282bb862a1069d1a3ad908ebf5bb64fd76df5df4dd715b3295a087e60c17c252` | 31 of 31 observed scripts parsed with no parse failures. | Static documentation frontend only. |
| E07 | swats.bio public bundle, REA `ev_863c9d053ba3780c76bcdb8117f04f86db197741f73c032b516651fe6deac62a` | Route strings group dashboard areas into editor, links, badges, inbox, widgets, settings, templates, leaderboard, and stats. Widget strings include Roblox, Discord, media embeds, YouTube, GitHub, Steam, and Valorant. | Route presence does not prove access, completeness, or current server behavior. The authenticated dashboard was not opened. |
| E08 | swats.bio public homepage runtime capture | Marketing promises layouts, colors, effects, badges, background music, widgets, templates, and analytics. The visual system uses a near-black base, restrained pink accent, strong display text, and live profile examples. | Homepage claim; not independent verification of every feature. |
| E09 | Fakecrime public pages | Public login uses email/password and recovery. Registration uses URL-prefixed name plus email/password. Marketing lists rich text, fonts, colors, cursors, image/GIF/video assets, music, socials, and Discord presence. | Public pages only; authenticated editing was not inspected. |
| E10 | E-Z public onboarding presentation | The customization story is staged as identity, socials, colors/background, then extras. | Public presentation only. |
| E11 | Linktree official help | Typography is separated into page/title typography and button text; items use an explicit drag handle for reorder. | Product documentation, not source-code analysis. |
| E12 | Beacons official help | Global design controls are separate from individual blocks. Blocks have their own image, layout, visibility, scheduling, and action controls. | Product documentation, not authenticated observation in this session. |
| E13 | User-supplied swats.bio authenticated dashboard screenshot, 2026-10-15 | A fixed left rail separates Account, Customization, and Insights. The account overview uses a slim top tab bar, announcement banner, five compact status metrics, a profile-completion checklist, account shortcuts, and a connections panel. The active item uses a muted pink filled state while most surfaces remain neutral. | One desktop screenshot at approximately 1872×969. It does not establish mobile behavior, interactions, data accuracy, or other dashboard screens. |
| E14 | Three user-supplied swats.bio authenticated customization screenshots, 2026-10-15 | Customization is split first into Editor, Links, and Widgets & Music, then into Profile & Assets, Effects & FX, Card Layout & Style, and Entry Screen. The editor keeps a large inspector beside a sticky real-time profile preview. Profile controls visibly include avatar replacement/removal, zoom and X/Y crop sliders, decoration, background color/media, and banner. Effects are assigned independently to display name, bio text, background, and overlay. | Desktop screenshots only. Controls below the viewport, save behavior, mobile layout, persistence, and server enforcement were not observed. |
| E15 | User-supplied swats.bio text-effects picker screenshot, 2026-10-15 | Effects open in a large searchable modal. Each effect is represented by a live visual tile using the actual profile name; selection is immediate and reversible. Visible choices include typewriter, shake, rainbow, sparkle, morph, shimmer, shine, glow, glitch, flames, scramble, flicker, flip, loading, blackout, bleeding, neon aurora, and reactive treatments. Some tiles visibly carry lock icons. | A screenshot proves presentation and labels, not exact animation code, performance, entitlement rules, or accessibility. |

Supporting captures and raw REA results live in `research/`. Earlier notes live in `PROFILE_RESEARCH.md` and `PROFILE_CUSTOMIZATION_BLUEPRINT.md`.

### Research conclusion

The useful shared model is not a wall of customization inputs. Mature tools divide the work into:

- account and claim onboarding;
- a calm overview dashboard;
- global profile design;
- ordered content blocks;
- per-block inspectors;
- media and integrations;
- publish and analytics.

user.pet should follow this information architecture and express it in its own visual system.

## 4. Product states and routes

### Signed out

| Route | Behavior |
|---|---|
| `/` | Existing public landing presentation. No claim form. Admin login is available. |
| `/{username}` | Public profile when the username exists. `/dome` works here. |
| `/login` or login modal | Founder email/password form with readable errors and recovery guidance. |

### Signed in, no claimed username

| Route | Behavior |
|---|---|
| `/` | Existing landing visuals can reveal compact founder actions. |
| `/claim` | Focused username claim step. This is the only state where the founder is asked to claim. |
| `/dashboard` | Redirect to `/claim` until an account has a username. |

The claim screen uses one narrow panel. Show `user.pet/` as a fixed prefix, normalize the typed value, validate while typing, and communicate available/unavailable without layout jumps. Claiming must be atomic in Firestore so two accounts cannot take the same username.

### Signed in, claimed username

| Route | Behavior |
|---|---|
| `/dashboard` | Overview, profile status, quick actions, compact analytics. |
| `/customize` | Full profile studio. |
| `/analytics` | Traffic and click reporting when data exists. |
| `/settings` | Account, username, session, and danger-zone controls. |
| `/{username}` | Published public profile. Owner sees a subtle edit affordance. |

Do not restore `/friends`. Remove it from the reserved route list after removing the feature so a real user may eventually claim `friends` only if product policy permits it; otherwise reserve it explicitly as a platform word, not because a feature route exists.

## 5. Visual direction

### Visual north star

The authenticated swats.bio screenshots supplied by the user are the primary visual reference for the user.pet dashboard and customization studio. The intended similarity is the overall product atmosphere and level of finish:

- a deep near-black application shell;
- a stable left navigation rail;
- a compact top header with understated tabs;
- thin, low-contrast borders separating large work areas;
- softly raised charcoal panels;
- restrained accent color for active items and primary actions;
- small technical labels paired with clear human-readable headings;
- dense controls that still have comfortable spacing;
- a wide editing area beside a tall, sticky real-time preview;
- visual pickers that demonstrate effects instead of describing them only in text;
- consistent radii, outlines, dividers, and control heights across every screen.

The result should make someone familiar with those screenshots recognize the same category and quality of creative profile tool. It must still be visibly user.pet. Translate the reference through these changes:

- use user.pet's blue as the primary product accent and purple as a limited secondary accent instead of the reference site's pink-heavy identity;
- use the official user.pet logo and existing dark/light logo assets;
- use user.pet terminology, icons, profile data, and original microcopy;
- simplify the navigation to the features user.pet actually supports;
- create original component proportions and compositions rather than tracing screenshot coordinates;
- preserve the existing public landing page and Dome's blue character;
- use the border and surface tokens in this document so the visual resemblance comes from a coherent system rather than copied CSS.

Do not reinterpret this direction as a generic glassmorphism dashboard, a bright purple SaaS template, or a collection of oversized cards. Before considering a dashboard or editor screen finished, compare it visually with the supplied references for density, border restraint, hierarchy, preview prominence, and polish.

### Character

The authenticated app should feel like a private creative tool built by user.pet: precise, low-noise, slightly playful, and comfortable for long sessions. It should not resemble a template admin dashboard. Avoid oversized gradient headlines, repeated glass cards, excessive rounded pills, decorative statistics with fake values, numbered marketing prose inside settings, and an icon beside every sentence.

### Core tokens

Use a small, consistent token system:

```css
--app-bg: #08090c;
--app-panel: #0e1015;
--app-panel-raised: #13161d;
--app-input: #0a0c10;
--app-border: rgba(255, 255, 255, 0.085);
--app-border-strong: rgba(255, 255, 255, 0.15);
--app-text: #f4f5f7;
--app-muted: #8d93a1;
--app-faint: #5e6470;
--app-blue: #28a8f6;
--app-purple: #a98bea;
--app-success: #71d39b;
--app-danger: #e87777;
--radius-control: 9px;
--radius-panel: 14px;
--shadow-float: 0 18px 50px rgba(0, 0, 0, 0.32);
```

Use blue for product identity and purple as a secondary creative accent. Most surfaces stay neutral. Accent color communicates selection, focus, publish status, or one primary action; it should not tint every border.

### Borders, panels, and controls

The supplied authenticated swats.bio screenshots establish the desired level of separation: nearly black surfaces remain distinct through thin outlines and small changes in value rather than bright card fills. Recreate that restraint in user.pet with its own blue/purple palette.

Use this border hierarchy consistently:

```css
--line-hairline: rgba(255, 255, 255, 0.055);
--line-default: rgba(255, 255, 255, 0.09);
--line-strong: rgba(255, 255, 255, 0.145);
--line-hover: rgba(255, 255, 255, 0.21);
--line-focus: rgba(40, 168, 246, 0.72);
--line-selected: rgba(169, 139, 234, 0.58);
--line-danger: rgba(232, 119, 119, 0.55);

--surface-page: #08090c;
--surface-rail: #0c0e13;
--surface-panel: #101218;
--surface-panel-raised: #14171e;
--surface-control: #0b0d12;
--surface-control-hover: #151821;
--surface-selected: rgba(169, 139, 234, 0.15);

--radius-small: 8px;
--radius-control: 10px;
--radius-panel: 16px;
--radius-modal: 20px;
```

Rules for applying them:

- Major panels use a 1px `--line-default` border and `--radius-panel`. They may use a faint top-to-bottom surface gradient, but the two colors should differ by no more than a few RGB values.
- Nested controls use `--line-hairline` or `--line-default` and `--radius-control`. Their border becomes `--line-strong` on hover.
- Selected navigation rows and tabs use a translucent accent fill, an accent border, and brighter text. Do not use a fully saturated fill across the whole row.
- Focused inputs use a visible 1px blue border plus `0 0 0 3px rgba(40, 168, 246, 0.12)`. Never remove the focus ring without replacing it.
- Inspector sections may share one outer border with internal 1px separators. This is preferred to wrapping every setting in a separate floating card.
- Horizontal rules use `--line-hairline`; they should be visible at normal brightness without competing with labels.
- The preview device uses a stronger outer border and black inner stage so the public profile remains visually separate from the editor.
- Modals use `--line-strong`, `--radius-modal`, and `--shadow-float`. A modal header and footer may be separated by hairlines while the middle content scrolls.
- Effect tiles use a neutral border by default. Hover strengthens the border; selection adds an accent border, faint accent fill, and a small checkmark. Locked state stays legible and includes a lock icon and explanation.
- Empty drop zones use a dashed `--line-strong` border. Once media is present, replace the dashed border with a normal asset frame.
- Status banners use tinted backgrounds and borders at low opacity. Informational blue, success green, and danger red should remain readable without becoming neon strips.
- Use shadows sparingly. Fixed rails and ordinary panels should rely on borders. Reserve stronger shadows for modals, dropdowns, dragged blocks, and the floating preview.
- Do not stack two visible borders flush against each other. When a control sits against a bordered container edge, use spacing or let the container separator provide the boundary.

Recommended component treatment:

| Component | Border and surface treatment |
|---|---|
| Sidebar | Right hairline, slightly lighter than page; no large shadow. |
| Top bar | Bottom hairline; transparent or same surface as content header. |
| Navigation item | Transparent by default; selected item gets tinted fill and accent outline. |
| Metric tile | Default outline, subtle raised surface, 12–14px radius. |
| Inspector group | One panel outline with internal separators and 16px radius. |
| Input/select | Dark inset surface, default outline, blue focus ring. |
| Secondary button | Default outline and transparent fill; lighter hover surface. |
| Primary button | Blue or controlled blue-to-purple fill, quiet matching outline, dark or white text with checked contrast. |
| Danger button | Transparent red tint and red outline until confirmation. |
| Preview frame | Strong neutral outline, 18–22px radius, shallow float shadow. |
| Effect tile | Default outline; selected accent outline/fill; preview inset uses a hairline. |
| Modal | Strong outline, 20px radius, deep neutral surface, floating shadow. |

On light mode, invert surface values deliberately rather than applying opacity over white. Use cool gray borders around `rgba(20, 28, 42, 0.10)` through `0.22`, and preserve the same hierarchy of hairline, default, strong, hover, focus, and selected states.

### Typography

- App UI: `Sora Variable` or `Outfit Variable`, with one selected consistently.
- Technical labels and small metadata: `Space Grotesk Variable` or the same UI face at smaller size.
- Profile fonts: user-selectable from the installed allowlist, including Outfit, Sora, Space Grotesk, Orbitron, and Pixelify Sans.
- Body text minimum: 14px desktop and mobile.
- Metadata minimum: 11px. Never use 7–9px text for meaningful controls.
- Use sentence case for actions and section names. Reserve lowercase styling for brand moments.

### Motion

Motion should explain state:

- 140–180 ms for hover/focus/control changes;
- 220–320 ms for panels and route transitions;
- spring motion only for draggable blocks and preview devices;
- profile entrance effects may be expressive but must respect `prefers-reduced-motion`;
- never animate the entire settings form on every change.

## 6. Dashboard specification

The dashboard is an overview, not the editor.

The supplied swats.bio screenshot confirms that a dense account overview can remain readable when navigation, status, onboarding, and account actions have distinct visual levels. Borrow that hierarchy, not its exact composition. For user.pet:

- group the left navigation into **Profile**, **Manage**, and **Account** rather than copying Account, Customization, and Insights;
- retain only product-relevant destinations: Overview, Customize, Analytics, and Settings;
- omit Inbox, Badges as a standalone account page, Leaderboard, language selection, and persistent Discord advertising;
- use a compact signed-in profile switcher/header at the top of the rail;
- allow one dismissible product notice below the top bar, but do not reserve permanent space for announcements;
- present real plan/status, views, links, and publish state in compact tiles when those values exist;
- use profile completion as optional onboarding that disappears once complete, rather than permanent dashboard furniture.

### Desktop structure

```text
┌──────────────┬────────────────────────────────────────────────────────┐
│ user.pet     │  @username                         View profile  avatar │
│              ├────────────────────────────────────────────────────────┤
│ Overview     │  Good evening, name                                     │
│ Customize    │  Your page is live at user.pet/name                     │
│ Analytics    │                                                         │
│ Settings     │  ┌─────────────────────┐  ┌──────────────────────────┐  │
│              │  │ profile snapshot    │  │ recent performance       │  │
│              │  │ avatar + status     │  │ views / clicks / CTR     │  │
│              │  │ Edit profile        │  │ real data or empty state │  │
│              │  └─────────────────────┘  └──────────────────────────┘  │
│              │                                                         │
│ theme/logout │  quick actions: edit appearance, add link, upload audio │
└──────────────┴────────────────────────────────────────────────────────┘
```

- Left rail: 224px, fixed on wide screens, one logo, four primary destinations, theme and account controls at the bottom.
- Visually group rail destinations with quiet uppercase labels and generous separation. The active destination gets a low-contrast filled row, a thin accent edge or dot, and brighter text. Avoid coloring the whole rail.
- Content width: max 1180px with 28–36px padding.
- Top bar: 58–64px. It should show the current profile URL and a real **View profile** action.
- Hero copy: one greeting line and one status line. No giant hero.
- Profile snapshot: render actual avatar, display name, username, publish status, and a small visual thumbnail.
- Analytics: use real values. If collection is not implemented, show a designed empty state and label it unavailable; do not invent numbers.
- Quick actions: Edit profile, Add link, Upload background, Add audio.
- A publish-status row should show saved/published timestamps once draft publishing exists.
- For incomplete profiles, show a checklist with only meaningful setup tasks such as avatar, bio, background, first link, and publish. Completed tasks use checkmarks and subdued struck text. Do not include engagement goals such as “reach 10 views” in setup completion.
- Account shortcuts may sit in a narrow secondary column: Edit username, Customize profile, Account settings, and connected Discord status. Avoid duplicating the full navigation list.

### Mobile structure

- A 56px top bar holds logo, page title, and avatar/menu.
- Primary destinations appear in a bottom navigation bar with Overview, Customize, Analytics, and Settings.
- Do not squeeze a desktop sidebar onto mobile.
- Content uses 16px page gutters and one column.
- Buttons and inputs have at least a 44px touch target.
- There is no horizontal page scrolling at 320px width.
- Cards must not be deliberately clipped offscreen in authenticated product pages.

## 7. Profile studio specification

The current editor must be reorganized. It should feel like a creative application rather than a long generated form.

### Desktop layout

```text
┌───────────┬───────────────────────────────┬──────────────────────────┐
│ app nav   │ inspector                     │ live preview             │
│           │                               │                          │
│ Overview  │ Profile / Design / Content    │ desktop | phone          │
│ Customize │ Media / Effects / Advanced    │                          │
│ Analytics │                               │ rendered public profile  │
│ Settings  │ selected category controls    │                          │
│           │                               │                          │
│           │ saved • 2m ago   Publish      │ View profile             │
└───────────┴───────────────────────────────┴──────────────────────────┘
```

- App navigation: 72px icon rail or the standard 224px rail, depending on viewport.
- Inspector: 430–520px.
- Preview: consumes remaining space and remains sticky within the viewport.
- A compact studio toolbar contains undo, redo, device mode, preview scale, save state, and Publish.
- The preview must render the same component and data schema as the public route. Do not maintain a fake preview implementation.
- Save draft changes with a short debounce. Publish is explicit and copies validated draft state to published state.
- Warn before leaving only when unsaved local changes exist.

The supplied authenticated editor screenshots validate a two-level navigation model. Implement that hierarchy without copying the source styling:

- primary studio areas: **Editor**, **Links**, and **Widgets & Music**;
- Editor subareas: **Profile & Assets**, **Effects**, **Layout & Style**, and **Entry Screen**;
- keep the chosen subarea and scroll position stable while the user changes preview device;
- on desktop, keep the real-time preview in a bounded sticky column with a clear label and open-profile action;
- keep editing controls in broad, calm sections separated by subtle rules rather than placing every field in its own card.

### Mobile editor

Do not show a tiny preview beside tiny controls.

- Use a segmented top control: **Edit** and **Preview**.
- Edit opens full-width category lists and inspectors.
- Preview opens the actual profile at phone width.
- Keep Save/Publish in a sticky bottom action area above device safe-area insets.
- Reordering uses a visible drag handle and also offers Move up/Move down in the item menu for accessibility.

### Studio categories

#### Profile

- avatar upload, crop, zoom, rotation, and remove;
- display name;
- username shown as read-only with a Settings shortcut;
- pronouns or short subtitle;
- bio with safe formatting and live character count;
- location and timezone toggles;
- badges with reorder and visibility;
- profile metadata such as browser title and description.

Avatar editing must expose a proper crop workflow. After a file is selected, show a crop viewport plus zoom and X/Y positioning. The user-supplied reference uses raw sliders directly on the page; user.pet should pair the visual crop viewport with precise controls and Reset. Decoration is a separate optional layer and must not be baked into the uploaded avatar.

#### Design

- layout preset: Focus, Stack, Canvas, Portfolio;
- alignment: left, center, right where supported;
- content width and density;
- profile surface on/off;
- surface fill, opacity, blur, border, radius, and shadow;
- text and muted-text colors;
- accent and secondary accent;
- page font, display-name font, link font, weights, tracking, and case;
- avatar shape, size, border, glow, and decoration;
- button style: solid, outline, soft, glass, underline, icon-only;
- button radius, border, fill, text color, shadow, and hover transform.

#### Content

Content is an ordered list of blocks. Every block supports enable/disable, duplicate, delete, and drag reorder.

- link button;
- social icon row;
- heading;
- rich text/markdown;
- image;
- image gallery/carousel;
- video/embed;
- divider/spacer;
- music player;
- featured card;
- skills/tags;
- project card;
- quote/lyrics;
- Discord presence;
- Discord server;
- optional later widgets for GitHub, YouTube, Steam, Roblox, or other services.

Adding a block opens a searchable command palette grouped by Basics, Media, Social, and Widgets. Selecting a block opens its inspector. The content list itself stays compact.

#### Media

- background image, animated GIF, or short video;
- background fit, focal position, scale, blur, brightness, saturation, overlay color, and overlay opacity;
- avatar and banner library;
- audio tracks with title, artist, cover, file, and duration;
- playlist reorder;
- autoplay preference represented honestly: browsers may require a click before audio starts;
- player style and position;
- volume, loop, shuffle, progress, waveform, and visualizer controls;
- custom cursor image with pointer hotspot and an automatic default on touch devices.

#### Effects

- entrance gate on/off;
- custom entrance title, subtitle, icon, and button label;
- entrance transition presets;
- background particles using `@tsparticles/react` only when selected;
- noise, grain, vignette, scanline, stars, rain, and gradient motion presets implemented efficiently;
- username glow, gradient, shimmer, typewriter, scramble, and subtle float;
- profile-card tilt using pointer input only, disabled for reduced motion and coarse pointers;
- visualizer color, gradient, intensity, smoothing, and placement;
- custom page click sound with separate enable and volume;
- animation speed control and a global reduced-motion-safe mode.

Effects are target-based. Store and edit them independently for:

- display name;
- username;
- bio text;
- profile surface/card;
- page background;
- foreground overlay;
- avatar decoration;
- individual blocks where explicitly supported.

Selecting **Change effect** opens a searchable visual effect browser rather than a native select menu. Each tile renders a small live preview using the owner's actual display name or representative profile content. Clicking a tile previews and selects it; clicking the selected tile again clears it. The browser provides categories such as Motion, Glow & Light, Glitch, Type, Particles, and Reactive, plus a clear **None** choice.

Start with a curated set that can be implemented well: None, Typewriter, Shake, Rainbow, Sparkle, Shine, Glow, Glitch, Scramble, Flicker, Loading, Blackout, Neon, and Reactive. Add Morph, Shimmer, Flames, Bleeding, Flip, and heavier effects only after their reduced-motion and mobile behavior are defined. User entitlement can be added later, but locked tiles must never appear without explaining how they unlock.

The effect picker itself must be keyboard navigable, searchable, and safe when reduced motion is enabled. Under reduced motion, use static thumbnails and describe the effect in text.

Do not allow ten effects to become active by accident. Show an estimated performance level and cap expensive simultaneous effects on mobile.

#### Advanced

- custom CSS is a later, sandboxed feature; do not inject arbitrary raw CSS into the main app document;
- SEO title and description;
- content warning/age gate;
- hide view counter;
- social link behavior: open, copy, or both;
- analytics toggle where legally appropriate;
- import/export user.pet profile JSON with schema version and validation;
- reset section and reset whole draft;
- template apply with a preview and choices to preserve identity, links, and media.

## 8. Public profile renderer

### Composition

The renderer has four layers:

1. `ProfileBackground`: color, gradient, image/video, overlay, and effects.
2. `ProfileEntrance`: optional user-initiated entry and media unlock.
3. `ProfileLayout`: Focus, Stack, Canvas, or Portfolio geometry.
4. `ProfileBlocks`: identity, links, media, widgets, and footer.

Keep these layers independent. A visual effect must not own profile data or routing.

### Layout presets

#### Focus

A compact central identity card with avatar, name, bio, socials, links, audio, and views. This is closest to the familiar high-impact bio profile.

#### Stack

A borderless or lightly surfaced vertical page. Identity appears first, followed by wide content blocks. Best for creators with many links.

#### Canvas

Desktop permits positioned/resizable modules within a bounded grid. Mobile uses an explicit ordered fallback. Never replay arbitrary desktop coordinates on a narrow phone.

#### Portfolio

Full-page sections for About, Projects, Skills, Gallery, Links, and Music. A compact section navigator may appear on desktop.

### Baseline behavior

- Deep links load directly on Vercel through SPA rewrites.
- Each profile controls its own document title, meta description, and social preview data where the hosting architecture permits it.
- Links validate protocols and use safe `rel` attributes.
- Rich text is sanitized before rendering.
- Background video is muted by default and pauses when hidden.
- Audio starts only after a valid user gesture when the browser requires it.
- Every control is keyboard reachable and visibly focused.
- Contrast remains readable over user media through overlays or warnings.
- Reduced motion disables entrance flourishes, particles, tilt, and continuous transforms.
- Mobile has no horizontal overflow at 320, 360, 390, and 430px widths.

## 9. `/dome` feature laboratory

`/dome` is both a real public profile and the first showcase profile. It must never become a random component dump.

### Ownership

- Canonical username: `dome`.
- Founder email: `zurihcs@gmail.com`.
- Store ownership by Firebase Auth UID in the profile/account documents.
- On first safe migration, bind the existing Dome profile record to that UID.

### Creative direction

- Preserve Dome's blue visual identity and existing profile assets.
- Keep the track named **Lucid Dreams** by **Juice WRLD**.
- Use the profile to test a cinematic background, readable central surface, custom type, audio visualizer, entrance, badges, socials, animated name treatment, and responsive blocks.
- Shop may be displayed as **Coming soon** or disabled. It must not perform an action.
- Provide a clean mobile fallback rather than shrinking the desktop composition.
- Any experiment must be controlled by the shared profile schema. Do not hard-code a Dome-only feature into the renderer.

The existing `src/profiles/dome/FriendProfile.jsx` name is historical and misleading after friends are removed. During implementation, migrate its useful styling/content into the shared renderer or rename it to a Dome-specific showcase component. Avoid two competing public-profile systems.

## 10. Data architecture

Use one versioned profile schema. Validate reads and writes with Zod.

```js
profiles/{username} = {
  schemaVersion: 1,
  username: 'dome',
  ownerUid: 'firebase-auth-uid',
  status: 'published',
  draft: ProfileDocument,
  published: ProfileDocument,
  draftUpdatedAt,
  publishedAt,
  createdAt
}

accounts/{uid} = {
  email,
  username,
  role: 'founder',
  createdAt,
  updatedAt
}

usernames/{normalizedUsername} = {
  uid,
  createdAt
}
```

`ProfileDocument` should contain:

```js
{
  identity: {
    displayName, subtitle, bio, location, timezone,
    avatar, banner, badges, showViews
  },
  theme: {
    layout, alignment, width, density,
    colors, typography, surface, avatar, buttons
  },
  background: {
    type, color, gradient, asset, fit, position,
    blur, brightness, saturation, overlay
  },
  entrance: {
    enabled, title, subtitle, icon, buttonLabel, transition
  },
  audio: {
    enabled, tracks, activeTrackId, playerStyle,
    position, volume, loop, shuffle, visualizer
  },
  effects: {
    background, identity, cursor, clickSound,
    intensity, reducedMotionMode
  },
  blocks: [
    { id, type, enabled, order, style, content }
  ],
  seo: { title, description },
  safety: { contentWarning, ageGate },
  updatedAt
}
```

### Publishing model

- Editor writes to `draft`.
- Public routes read `published` only.
- Publish validates the entire document, then atomically updates `published` and timestamps.
- Autosave state is visible: Saving, Saved, Error.
- Keep a small revision history later; do not block the first solid implementation on it.

### Media

Firebase Storage must be initialized before persistent uploads can work. Until it is configured:

- keep URL fields or local preview object URLs clearly labeled as preview-only;
- do not save `blob:` URLs to Firestore;
- do not claim that an upload is permanent;
- build a storage adapter so Firebase Storage can replace the preview adapter cleanly.

Enforce file type, file size, ownership, and deletion rules. Compress large images client-side. Generate safe filenames rather than trusting uploaded names.

## 11. Component architecture

Suggested boundaries:

```text
src/
  app/
    AppRouter.jsx
    AuthGate.jsx
    FounderGate.jsx
  dashboard/
    DashboardShell.jsx
    DashboardOverview.jsx
    DashboardNav.jsx
  studio/
    ProfileStudio.jsx
    StudioToolbar.jsx
    StudioInspector.jsx
    StudioPreview.jsx
    BlockList.jsx
    BlockLibrary.jsx
    inspectors/
      IdentityInspector.jsx
      DesignInspector.jsx
      MediaInspector.jsx
      EffectsInspector.jsx
      AdvancedInspector.jsx
      blocks/
  profiles/
    PublicProfileRoute.jsx
    PublicProfile.jsx
    layouts/
    blocks/
  shared/
    profileSchema.js
    profileDefaults.js
    profileSanitization.js
  data/
    accountStore.js
    profileStore.js
    mediaStore.js
    analyticsStore.js
```

This is a target organization, not permission for a blind rewrite. Migrate in working slices and preserve the current landing page.

### State ownership

- Firebase/Auth owns authenticated identity.
- Firestore owns saved draft and published profile documents.
- Zustand may own temporary studio UI state, history, selected block, preview mode, and dirty state.
- React Hook Form and Zod own inspector validation.
- Public renderer accepts a complete validated profile object and has no editor dependencies.

## 12. Package use

The repository already contains focused packages. Use them where their capability is needed:

| Package | Intended use |
|---|---|
| `@dnd-kit/*` | Accessible block and playlist reordering. |
| `react-hook-form`, `zod`, `@hookform/resolvers` | Inspector forms and schema validation. |
| `zustand` | Studio selection, history, preview, and local draft state. |
| `react-dropzone` | Media drop targets. |
| `react-easy-crop`, `react-avatar-editor` | Avatar/banner crop workflows; choose one per workflow rather than stacking both. |
| `react-colorful`, `chroma-js` | Color controls, contrast checks, gradients, and derived palettes. |
| `react-resizable-panels` | Desktop inspector/preview split. |
| `react-rnd` | Canvas-layout modules only. |
| `motion` or `gsap` | UI/profile motion. Prefer one animation system per component. |
| `@tsparticles/react`, `@tsparticles/slim` | Optional particle background preset. |
| `howler`, `wavesurfer.js`, `@fft-visualizer/react` | Audio playback, waveform editing, and visualizer. Load heavy audio tooling only where used. |
| Radix UI packages | Accessible dialogs, tabs, selects, sliders, switches, popovers, and tooltips. |
| `lucide-react`, Iconify/Simple Icons | Product and social icons. Maintain one visual icon style per context. |
| installed Fontsource packages | Local app and profile typography without runtime font-CDN dependence. |
| `sonner` or `react-hot-toast` | Pick one notification system and remove duplicate usage. |
| `@vercel/analytics` | Existing site analytics integration. This is distinct from per-profile analytics. |

Use route/component lazy loading for the editor, particle engine, waveform, cropper, and other heavy modules. Public profiles should not download the whole editor.

## 13. Feature sequence

### Phase 0 — Stabilize

- Audit the dirty working tree before editing.
- Confirm the app builds.
- Remove Friends UI, routes, imports, stores, and related Firebase rules safely.
- Preserve the landing page and `/dome` while consolidating routing.
- Confirm claims are hidden when signed out.

Acceptance:

- `npm run build` succeeds.
- Signed-out `/` shows no claim UI.
- `/friends` no longer renders a product feature.
- `/dome` still loads directly.

### Phase 1 — Account and shell

- Finish founder authentication and allowlist handling.
- Implement signed-in claim flow.
- Build responsive DashboardShell and Overview.
- Make View profile open the claimed URL.

Acceptance:

- Each approved founder can authenticate using their Firebase Auth password.
- Unapproved accounts cannot enter founder tools.
- A founder with no username sees claim; a founder with one sees dashboard.
- Desktop and 320px mobile have no horizontal overflow.

### Phase 2 — Profile core

- Finalize schema, draft/published separation, shared renderer, and Focus/Stack layouts.
- Implement identity, design tokens, links/socials, avatar crop, background, and preview.
- Convert Dome to the shared schema.

Acceptance:

- Editor preview and public URL render the same profile data.
- Refreshing the public route preserves published appearance.
- Draft changes are invisible publicly until Publish.

### Phase 3 — Media and effects

- Configure Firebase Storage and adapter.
- Implement background media, audio library/player, waveform/visualizer, entrance, particles, cursor, and reduced-motion behavior.

Acceptance:

- Uploaded assets persist after refresh.
- Audio behaves correctly under browser gesture restrictions.
- Mobile and reduced-motion modes disable unsuitable effects.

### Phase 4 — Blocks and layouts

- Implement block library, individual inspectors, reorder, Canvas mobile fallback, and Portfolio layout.
- Add safe rich text and selected widgets.

Acceptance:

- Blocks can add, edit, reorder, duplicate, hide, and delete.
- Keyboard reordering is possible.
- Every block has a defined mobile rendering.

### Phase 5 — Analytics and polish

- Add real profile views and outbound-click events with basic abuse filtering.
- Add top links, referrers, devices, and countries only where collection is accurate and disclosed.
- Add templates, import/export, publish history, and performance budgets.

Acceptance:

- Dashboard never displays fabricated analytics.
- Analytics events do not include passwords, private draft content, or unnecessary personal data.

## 14. Quality bar

### Design review

- One clear primary action per screen.
- Control labels describe the setting; helper text appears only where needed.
- Related controls share a section; unrelated effects do not sit in the same card.
- Empty states explain the next useful action.
- Loading uses stable skeletons or quiet progress; no flashing layout.
- Error messages name the field/action and recovery step.
- The dashboard and studio look authored by the same product.

### Functional review

- Auth loading never briefly reveals protected UI.
- Allowlist checks are enforced by backend security rules or trusted claims in addition to UI gating.
- Username claims are normalized, reserved-word checked, and transactional.
- Direct routes work on deployed Vercel hosting.
- Owner checks use UID.
- Shop controls are disabled.
- Friends code and data access are absent.

### Responsive review

Test at 320×568, 360×800, 390×844, 430×932, 768×1024, 1280×720, and 1440×900.

- No horizontal document overflow.
- Modals fit the viewport and scroll internally when necessary.
- Sticky mobile actions do not cover fields.
- Preview mode is usable with touch.
- Background media covers without hiding essential identity.
- Profile text remains readable over the brightest and darkest user images.

### Performance review

- Lazy-load studio-only packages.
- Pause offscreen video, particles, waveform rendering, and animation loops.
- Respect reduced motion and low-power mobile conditions.
- Avoid storing full media blobs in React state longer than needed.
- Revoke preview object URLs.
- Keep the initial public profile bundle small enough that the identity and main links appear promptly on a mid-range phone.

## 15. Instructions for the implementing model

1. Read this file, `PROFILE_RESEARCH.md`, `PROFILE_CUSTOMIZATION_BLUEPRINT.md`, `package.json`, and the current relevant source before editing.
2. Inspect `git status`. The worktree already contains in-progress changes; do not discard them or reset the repository.
3. Start with Phase 0 and make one coherent, buildable slice at a time.
4. Preserve the existing landing page unless a change is necessary for signed-in state handling.
5. Remove the friends feature fully rather than merely hiding its navigation link.
6. Do not copy minified code, assets, wording, trademarks, or distinctive page compositions from researched sites.
7. Treat REA route strings as evidence of information architecture only. Do not claim observed authenticated behavior where none was executed.
8. Use real profile data in preview and public rendering.
9. Run the production build after meaningful implementation slices. Add targeted tests only where logic warrants them, especially username normalization/claiming, schema migration, ownership, and publish behavior.
10. Do not start a persistent server or deploy without a direct request.

## 16. Definition of the intended result

A founder signs in, claims a username if needed, and lands in a calm dashboard. They can open a serious profile studio, choose a foundation, and progressively make the profile as simple or as wild as they want. The preview is faithful. Publishing is explicit. The resulting `user.pet/{username}` link works on phones and desktops, performs well, remains accessible, and visibly belongs to user.pet.

`/dome` demonstrates that ceiling using the same system available to every founder. The app contains no friends product, no public claim prompt, no fake analytics, and no shop behavior yet.
