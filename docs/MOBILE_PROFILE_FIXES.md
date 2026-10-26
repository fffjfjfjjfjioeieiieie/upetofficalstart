# Mobile profile regression fixes

## Saving small cards

The profile editor supports 300px cards and the redesign normalizer supports 280px cards, but the document schema rejected widths below 320px. The document validator now accepts the normalizer's 280px minimum. Regression tests round-trip widths 280, 300, 319, 320, 440, 620 and 900 with minimal/zero-opacity styling.

## Music player overlays and progress

Uploaded and streaming floating players now portal into the profile scene overlay. Their left/right positioning uses the scene bounds rather than a scaled, blurred or tilted card's containing block. This also keeps auto-open notifications inside mobile previews. The popup responds when its setting is turned off, and player widths cap at the available space even when a larger scale is configured.

The native seek control previously combined relative and absolute positioning classes. Its containing track could collapse to zero width. It now sits in an explicit full-width positioned wrapper with reserved space below the controls. Invalid/unknown durations disable seeking until metadata arrives. Audio initially preloads metadata rather than requesting full playback data.

## Decorations

Twenty-two external `.png` decorations contain APNG animation chunks. Their animation metadata is recorded in `public/decorations.json`; there is no visitor-time file inspection. Normalization respects explicit metadata and does not assume that every WebP is animated. Picker thumbnails have animation labels, selected Discord decorations animate, and empty filters explain that no matching items exist.

## Validation

- 27 focused Node tests passed, including small-card publication round trips and animation metadata.
- Local Chromium checks at 1440px, 390px and 320px verified uploaded/streaming placement, visible seek geometry and simulated playback updates, popup bounds and toggling, and animation filters.
- The same local run checked the pending Shop component integration, editor publication, product tabs/duplication and the homepage shared buttons without runtime errors.
- Browser tests used local fixtures and intercepted APIs; they did not read or modify production Firebase data.
- No Firestore listeners, polling or per-navigation database writes were added for these fixes.

The player and decoration fixes were deployed on 24 October 2026.

## Mobile scrollbar gutter follow-up

The slideshow's custom desktop scrollbar reserved a 6px strip on phones. With Chromium's normally hidden test scrollbars enabled, a 390px scene had a 384px scroll viewport. The fix hides scrollbar chrome only inside profile scenes at widths up to 767px; it does not disable overflow, touch scrolling or scroll snap.

Local Chromium verification covered slideshow and long list profiles at 320, 360, 390 and 430px. Every scene used the full phone width, slides and long content remained scrollable, and the desktop scrollbar stayed 6px. No runtime errors were observed. The reproduction used public profile configuration in a local fixture with external requests blocked; the fix adds no backend traffic or effects.
