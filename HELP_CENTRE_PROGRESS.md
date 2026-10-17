# Upet Help Centre progress

Last updated: 17 October 2026

## Architecture audit

- Authoritative application: Vite 7, React 19 and React Router, under `src/redesign`.
- Styling: Tailwind CSS 3 with source-owned shadcn/ui components under `src/redesign/components/ui`.
- Identity and data: Firebase Authentication, Firestore and Firebase Storage in project `upet-c480b`.
- Hosting: one Vercel project currently owns `user.pet`, `www.user.pet` and `help.user.pet`.
- Integration choice: `src/main.jsx` selects the isolated `HelpApp` only on `help.user.pet`. `/help-preview` provides a local/review route. The main user.pet application and routes are unchanged.
- Authentication persistence is origin-scoped, so a user may need to sign in separately at `help.user.pet`. The same Firebase UID remains authoritative.
- Actual Upet logo component and existing shadcn/ui sources are reused. No parallel UI dependency set was installed.

## Stage status

- Stage A — complete: audit, feature branch, isolated host-aware app, shell, routing and tokens.
- Stage B — complete for initial release: responsive home, categories, bundled reviewed starter guides, search, category and article pages.
- Stage C — complete for text tickets: authenticated creation, private list, private thread, replies, validation and Firestore persistence. Attachments are visibly unavailable pending scanning/private-download support.
- Stage D — complete for the initial owner inbox: live inbox, search/filter, public replies, internal notes, assignment to self, category/priority/status/resolution changes and append-only audit writes.
- Stage E — safe initial release: stable legal routes show “Policy being prepared” unless an approved Firestore document exists. Owner-only private draft editor added. No legal draft is auto-published.
- Stage F — foundation complete: persisted staff roles and capability-ready schema with owner bootstrap from the existing verified founder boundary. Moderator access defaults to none; invitation UI is intentionally unavailable.
- Stage G — released: production build, Firestore rules/indexes, main-branch merge and Vercel deployment completed. Responsive browser review and permission-denial emulator coverage remain follow-up work.

## Known release limits

- Public account registration is not open in the main product. Ticket access therefore works for existing Firebase accounts.
- Ticket attachments, email notifications, Discord webhooks, SLA/overdue calculations, exports and deletion workflows are unavailable.
- Starter articles are bundled and factual. Staff article drafts persist to Firestore, but publishing bundled replacements needs a later controlled editorial release.
- Legal configuration is incomplete; see `LEGAL_CONFIGURATION_CHECKLIST.md`.

## Security decisions

- Ticket reads and writes are scoped by Firebase UID in Firestore rules.
- Internal notes require active support staff membership and are excluded from requester queries.
- Staff routes are guarded in the UI and every data operation is independently checked in Firestore rules.
- Staff roles live in `supportStaff/{uid}`. Existing verified founders can bootstrap their own owner record; subsequent staff changes require an active owner.
- Ticket IDs are opaque. Human references are display identifiers and are never used for authorization.
- Ticket text is rendered as escaped React text. Arbitrary HTML is not executed.
- Attachments remain disabled until private storage, MIME/size validation and malware-handling controls exist.

## Verification checklist

- [x] Production Vite build passes.
- [x] Firestore rules compile.
- [x] Firestore indexes deploy (new indexes may require a short build period in Firebase).
- [ ] Requester can create/read/reply to own ticket.
- [ ] Requester cannot read a different UID’s ticket or internal notes.
- [ ] Owner can view queue, reply, add note and update state.
- [x] Vercel production aliases retain `user.pet` for the main product.
- [x] `help.user.pet` is attached to the host-aware HelpApp production deployment.
- [ ] 360px, 390px, 768px, 1280px and 1440px layouts reviewed.

