# UPET HELP CENTRE — ARTICLES, SUPPORT TICKETS, STAFF PORTAL & LEGAL PAGES

**Implementation specification for Codex**  
**Target:** `https://help.user.pet`  
**Project:** Upet / user.pet  
**Status:** Implementation brief, not proof of deployed features or legally approved policies.

## 0. Mission and boundaries

Build a **real, secure, visually premium support centre** for Upet. Users must be able to search helpful articles and contact Upet's owners through a private ticket system. The first staff version should support **owners only**; the architecture must safely extend to moderators and support agents later. Publish clean URLs for Terms of Service, Privacy Policy, Cookie Policy, Community Guidelines, Acceptable Use, Marketplace Rules and related disclosures, but mark legal content as **DRAFT — NOT APPROVED FOR PUBLICATION** until the actual operator and operations have been verified. Do not fabricate business identity, promises, age requirements, data-retention periods or guarantees.

This is a new help application, **not** a replacement for the main Upet dashboard or its authentication. Do not overwrite the main app, reset user profiles, replace Firebase, delete collections, modify production rules without approval, or deploy without explicit owner approval.

**Priority:** safe and working over huge feature counts. No dummy forms that pretend to submit. Implement working features or visibly label them unavailable.

## 1. Audit and integration (do this before coding)

1. Inspect the **actual repository** and identify whether the current authoritative Upet implementation is Vite + React + Firebase or the separate CRA/CRACO prototype ZIP. Do **not** merge those apps blindly.
2. Locate source folders, scripts, Tailwind version, shadcn registry/config, routing system, auth provider, Firebase config, existing rules, styles, icon assets and domain settings.
3. Reuse existing verified auth + UID; never authenticate on client-side email allowlists alone. Confirm the `help.user.pet` auth-domain and redirect/cookie strategy works securely across subdomains.
4. Check whether `help.user.pet` has its own repository/Vercel project. Prefer a separate deployable frontend or a clearly isolated application, sharing a package/design tokens only when it avoids duplicated dependencies.
5. Create a development branch, inventory existing files, write a short plan, then implement in small verified milestones. Keep production untouched.
6. Validate the operator's ownership of the domain and branding. Use the **actual Upet logo**, not a generated substitute.

**Never hardcode a password, service-account private key, privileged UID, billing credentials or secrets into client JavaScript.**

## 2. Visual art direction

Support site must feel related to Upet, but deliberately more calm, legible and trustworthy than the highly customizable profile editor. Use **shadcn/ui** components consistently rather than handcrafted HTML imitators. Keep page background charcoal/near-black, neutral layered panels, crisp white typography and disciplined use of Upet electric blue. Provide light mode later only if existing theme infrastructure supports it without delays.

### Design tokens — implementation targets, not measured source values

| Token | Target |
|---|---|
| Background | `#0B0B0F` |
| Panel | `#17171C` |
| Elevated surface | `#202026` |
| Input | `#202025` |
| Border | `#34343C` |
| Text primary | `#F5F5F7` |
| Text secondary | `#A4A4AE` |
| Text muted | `#777782` |
| Brand accent | `#378BFA` |
| Success | `#2FC78B` |
| Warning | `#E9B661` |
| Destructive | `#E16A70` |
| Content max-width | `1160px` |
| Article reading width | `760px` |
| Top nav | `64px` |
| Hero vertical padding | `72px` desktop / `48px` mobile |
| Primary buttons | `40px` height / `9px` radius |
| Inputs | `42px` height / `9px` radius |
| Cards | `14px` radius, `1px` border, `20–24px` padding |
| Main body font | Inter or Manrope, 14–15px |
| Page titles | 34–44px desktop, 28–32px mobile |
| Interaction transitions | 140–180ms ease-out, respect reduced motion |

Ensure minimum sensible contrast, visible focus rings, large touch targets and 360/390/768/1280/1440px responsive verification. Do not use gratuitous blur, unreadably tiny metadata or animated particles on support pages.

## 3. Routes, page-by-page

**Public routes:**

- `/` — homepage; large search bar, six help categories, featured articles, quick contact route, informative system status link only if status is implemented.
- `/search?q=` — fast article search, tag/category filters, no-result guidance.
- `/category/:slug` — category landing and grouped articles.
- `/articles/:slug` — article body, table of contents, breadcrumbs, last reviewed date, related articles, accessibility, optional feedback buttons only if feedback is persisted.
- `/contact` — explain support paths, category picker and login requirement when applicable.
- `/tickets/new` — create a genuine ticket; authentication preferred. For guest reports, allow only if safe abuse controls, verification and reply mechanism exist.
- `/tickets` — user's own tickets only.
- `/tickets/:ticketId` — private ticket conversation; no global ticket browsing.
- `/legal/terms` — Terms of Service (draft until approved).
- `/legal/privacy` — Privacy Policy (draft until approved).
- `/legal/cookies` — Cookie Policy (draft until approved).
- `/legal/community-guidelines` — Community Guidelines.
- `/legal/acceptable-use` — Acceptable Use Policy.
- `/legal/marketplace` — seller/buyer policies, initially informational until marketplace operations are defined.
- `/legal/refunds` — payment/refund/dispute overview, withheld from public launch until actual payment rules are known.
- `/legal/intellectual-property` — copyright/trademark reporting process.
- `/legal/accessibility` — accessibility statement and contact route.

**Protected staff routes:**

- `/staff` — overview; queues, counters, priority tickets, overdue cases (only if deadlines are genuinely defined).
- `/staff/tickets` — ticket inbox, filters, sorting, assignment, tagging, urgency and search.
- `/staff/tickets/:ticketId` — staff ticket view with public replies vs private internal notes, attachments, status, assignments, audit timeline.
- `/staff/articles` — draft/review/publish/archive article management, version history.
- `/staff/categories` — category and navigation management.
- `/staff/reports` — reports queue, if reports feature implemented.
- `/staff/team` — owner-managed invitations and permissions, **initially owner-only**.
- `/staff/settings` — support configuration and privacy/retention settings.
- `/staff/legal` — legal draft content with explicit publication gate.

No staff page content should render or be fetched for a non-staff user; protect backend operations independently of route guards.

## 4. Homepage composition, top to bottom

1. **Header:** actual Upet logo; links Help, Articles, Policies, Contact; sign-in/account or ticket link as appropriate; return to user.pet.
2. **Hero:** title `How can we help?`, subtitle `Find answers or contact the Upet team.`, centered shadcn `Input` search with Lucide `Search`, width 640px on desktop, full width on mobile. Pressing Enter must navigate to results.
3. **Popular topics:** six cards: Account & Login, Profiles & Customization, Links & Widgets, Marketplace, Safety & Reports, Billing & Payments. Cards have 20px icon, title, one-line description, arrow on hover. Categories not yet supported should have honest `Coming soon` labels, not dead links.
4. **Featured articles:** 4–6 cards driven by published article documents, not hardcoded broken routes.
5. **Need help?** distinct but restrained CTA: `Open a support ticket`. Include note that only Upet owners currently handle tickets; never promise 24/7 replies or response times.
6. **Footer:** support copyright/branding, policies, main website, Discord if verified, privacy/contact links.

Responsive grid: 3 columns at >=1024px, 2 at >=640px, 1 on mobile. Max content width 1160px. Vertical spacing 28px between grouped areas, 56–72px between major sections.

## 5. Exact component/library mapping

| Location | Use | Behaviour |
|---|---|---|
| Shared header | shadcn `Button`, `DropdownMenu`, `Avatar`, Lucide | user menu, return to main site, accessible keyboard support |
| Main search | shadcn `Input`, `Command` only for optional suggestions | real search, debounce 180–250ms, Enter handling |
| Categories | shadcn `Card`, `Badge` | clickable where published, disabled labelled otherwise |
| Article pages | shadcn `Breadcrumb`, `Separator`, `ScrollArea` where needed | semantic headings, anchor ToC, readable code blocks |
| Tickets list | shadcn `Tabs`, `Badge`, `Select`, `Skeleton` | filters and accurate status |
| New ticket | shadcn `Form`, `Input`, `Textarea`, `Select`, `Button`, `Alert` | React Hook Form + Zod schema; validations server-side too |
| Ticket thread | shadcn `Card`, `Avatar`, `Textarea`, `Button`, `AlertDialog` | secure replies, accessible attachments |
| Staff inbox | TanStack Table + shadcn `Table`, `DropdownMenu`, `Popover` | assigned/unassigned, sortable, searchable |
| Internal notes | shadcn `Tabs` / `Badge` | clearly distinguish private note from external reply |
| Article editor | Tiptap if already present or simple Markdown editor | sanitised output, no script execution |
| All feedback | `sonner` toast | only show success after server confirms |
| Staff action menus | shadcn `Dialog` and `AlertDialog` | irreversible actions require confirmation |
| Icons | `lucide-react` | consistent stroke width, 16–20px UI icons |
| Cache/data | TanStack Query where already compatible | secure scoped keys, invalidation on mutations |
| Animation | CSS first; Motion only where useful | 150ms motion, reduced-motion support |

Avoid shipping libraries merely to hit a library count. Never build a second homegrown button/toggle/dialog component next to the shared shadcn component.

## 6. Ticket workflow — real and persistent

### Customer-facing

- A logged-in user submits **subject (6–120 chars), category, description (20–5000 chars)** and optional attachments (restricted types, limits and malware safeguards). Link to their Firebase UID.
- Categories: Account access, Profile editor, Bugs, Safety/Abuse, Marketplace, Payment issue, Other. Categories that do not have staff processes may still accept tickets but display honest routing.
- On successful creation, generate a human-readable reference such as `UP-2026-000123` using a server-controlled counter/ID; never trust a client-generated sequential ticket number for authorisation.
- Statuses: `open`, `in_progress`, `waiting_on_user`, `resolved`, `closed`. Show friendly translated labels.
- Users see their own chronological thread, timestamps, staff display names, status changes and ability to reply while permitted.
- Sending a reply after resolution can reopen the ticket through an explicit supported transition.
- Show `Ticket created` only when the backend saved it. Protect from duplicate submissions and retry safely.
- Avoid exposing private staff notes, moderation flags, other users' identities or staff internal audit information.

### Owner-facing

- Staff can list, filter and assign incoming tickets; owners get all queues.
- Staff can send **public replies** or **private internal notes** using separate editor states and distinct colours/warnings. Internal notes must never appear in user API responses or public snapshots.
- Owners can assign ticket to owner/staff member, change category, priority, status and tags, set a resolution summary, and reopen.
- Record action events for assignment, status, access and deletion/redaction.
- Notify staff of new tickets through a server-originated event/email/optional Discord webhook **only when credentials are stored securely**, with no sensitive content in public webhooks.
- Start with an owner inbox that can work manually; do not promise automated response time or AI triage.

### Future moderator permissions

Use role capabilities, not `email in ADMIN_EMAILS` checks. Roles: `owner`, `support_admin`, `support_agent`, `moderator`, `user`. Restrict by capability:

| Action | Owner | Support admin | Agent | Moderator |
|---|---|---|---|---|
| Read assigned tickets | Yes | Yes | Yes | Reports/assigned only |
| Read all support tickets | Yes | Yes | No by default | No |
| Public ticket reply | Yes | Yes | Assigned | Allowed scoped queues |
| Internal notes | Yes | Yes | Assigned | Scoped queues |
| Assign tickets | Yes | Yes | No | No |
| Create/edit articles | Yes | Yes | Draft only if granted | No by default |
| Publish legal policies | Owner with publication gate | No | No | No |
| Grant/revoke staff roles | Yes | No | No | No |
| Export/delete user data | Owner only and verified workflow | No | No | No |

Grant roles via a **trusted Firebase Admin SDK/server endpoint** with audited actions; use custom claims for coarse capabilities and server-side Firestore membership/assignments for ticket scoping. Revoke sessions/refresh tokens when high-risk privileges are revoked where appropriate. Frontend visibility is not an authorisation system.

## 7. Suggested data model (adapt to existing backend)

- `helpArticles/{articleId}`: `slug`, `title`, `excerpt`, `categoryId`, `tags`, `body`, `status` (`draft`,`review`,`published`,`archived`), `createdAt`,`updatedAt`,`reviewedAt`,`authorUid`,`version`, `locale`.
- `helpCategories/{categoryId}`: `slug`,`name`,`description`,`icon`,`sortOrder`,`published`.
- `supportTickets/{ticketId}`: `reference`,`requesterUid`,`subject`,`category`,`status`,`priority`,`assignedToUid`,`createdAt`,`updatedAt`,`lastPublicMessageAt`,`tags`, `lockedAt?`.
- `supportTickets/{ticketId}/messages/{messageId}`: `authorUid`, `authorRole`, `visibility` (`public`|`internal`), `body`, `attachments`, `createdAt`, `editedAt?`.
- `supportTickets/{ticketId}/audit/{auditId}`: actor, action, safe field deltas and timestamp; append-only.
- `supportStaff/{uid}`: role/capabilities/assigned queue, active flag, createdAt, addedBy; **server-writable only**.
- `helpLegalDocuments/{slug}`: title, jurisdiction, draft body, version, review state, approval metadata, effective date **only after approved**.
- `helpFeedback/{id}` (optional): article vote, minimal metadata and rate limits.

Use Firestore server timestamps, validated state transitions, indexes for staff inbox, pagination, soft-close/archive, minimum necessary personal information and clear retention configuration. Store attachments in private Firebase Storage paths using restricted signed/download flows rather than public bucket URLs.

## 8. Security baseline and threat model

- Only owner/staff verified on trusted server may change assignments, role grants, article publishing state or legal publishing state.
- End users may only create/read/reply to **their own** tickets, and never change requester UID or internal fields.
- No client-writable `isOwner`, `role`, `staff`, `isFounder` or moderator flags in profile documents.
- Firestore rules are deny-by-default and tested via emulator with malicious scenarios. Remember Admin SDK bypasses security rules: backend code must validate separately.
- Sanitise article body and ticket rich text; never execute HTML/JS from user data. Escape all ticket content. Validate links/attachments and file MIME/size server-side.
- Rate limit ticket creation, replies, searches and attachments at a trusted server or with appropriate anti-abuse controls.
- Protect staff from XSS, malicious links, file abuse, spam and sensitive-data disclosure.
- No sensitive ticket details in client error analytics, notification payloads or webhooks.
- Ticket IDs are opaque; do not rely on ID obscurity for privacy. Always authorise on read, list, write and downloads.
- Consider data access/export, retention, deletion, incident handling and moderation-report escalation.
- If staff are minors or users are minors, get appropriate specialist guidance before operating moderation flows.

### Essential tests (must automate where possible)

1. User A cannot fetch or list User B tickets/messages/attachments.
2. Ordinary user cannot write internal note, read internal note, impersonate staff, change ticket assignee or elevate role.
3. Staff agent cannot see unassigned/private queues outside their scope.
4. Revoked staff role loses access, including refreshed auth sessions.
5. Article draft, preview and unpublished legal draft remain invisible to public.
6. Invalid ticket data and oversized/unapproved attachments are rejected server-side.
7. User can view their own ticket after refresh and sign in on allowed subdomains.
8. Race/duplicate submit doesn't create two tickets accidentally.
9. Published search excludes drafts and respects access rules.
10. No keys, emails with passwords or tokens enter client bundle.

## 9. Help articles — starter editorial inventory

Write accurate, genuinely helpful articles; never invent features known to be incomplete. Use clear `Available now`, `Coming soon`, or `Depends on account` statuses as appropriate.

### Accounts & Login
- Create an Upet account
- Change or reset your password
- Recover access to your account
- Protect your account and recognise phishing
- Request account/data deletion

### Profiles & Customization
- Claim a username
- Edit display name, bio and avatar
- Add and reorder links
- Customize backgrounds, glows and effects
- Upload frames and use permitted assets
- Preview and publish your profile
- Fix unsaved changes or failed uploads

### Marketplace
- How listings work (publish only once operational)
- Buying and selling safely
- Report a suspicious listing
- Disputes, cancellations and refunds (only after policies approved)

### Trust & Safety
- Report an account or profile
- Report impersonation and copyright violations
- Account restrictions and appeals
- Protect personal information

Each article must have: title, category, short summary, steps, related links, last reviewed date, and a support escalation link. Internal article-editor status must not leak into public pages.

## 10. Legal and policy pages — structured DRAFT templates, not made-up facts

**Critical:** Draft legal documents in plain UK English, with placeholders for verified specifics and explicit editorial review status. Do NOT automatically publish a boilerplate privacy policy or promise it is legally compliant. Do not automatically infer a company name, registered address, data controller, business contact, age limit, fee, refund rule, data-retention schedule, payment provider, legal jurisdiction for non-UK visitors, or dispute resolution process.

### A. Terms of Service `/legal/terms`

Create structured sections: operator identity/contact; eligibility and accounts; user profiles and content; prohibited activities; licences to display user content; third-party links/widgets; paid and premium features only when live; marketplaces and role of platform; suspension and appeals; IP rights; service changes; liability boundaries subject to mandatory consumer protections; governing law subject to mandatory rights; terms updates; complaints and contact. Mark areas requiring owner decisions.

### B. Privacy Policy `/legal/privacy`

Cover real data categories, controller/contact, collection sources, purposes, lawful basis **per purpose**, processors/recipients (Firebase, Vercel and any actually used providers), cross-border transfers and safeguards, retention period/criteria, security, user rights and how to exercise, complaints to ICO, automated processing if any, children, changes and effective date. Require a data mapping exercise against the **actual code** before wording is final.

### C. Cookie Policy `/legal/cookies`

Inventory real cookies, browser storage and tracking SDKs (including necessary auth cookies / localStorage, analytics and advertising if present). State purpose, provider, duration, necessity and control mechanisms. Implement consent before non-essential cookies/trackers are set where legally required; don't add a decorative consent banner disconnected from real tracking.

### D. Community Guidelines `/legal/community-guidelines`

Respectful behaviour, impersonation, harassment, sexual exploitation, privacy/doxxing, scams, malware, prohibited content, reporting, moderation actions, appeal path. Provide safety escalation suitable to the real risks and legal obligations.

### E. Acceptable Use `/legal/acceptable-use`

No phishing, fraud, spam, credential theft, malicious downloads, privacy invasion, or unlawful goods; no exploiting profile custom HTML/scripts. Explain content restrictions and enforcement fairly.

### F. Marketplace Rules `/legal/marketplace`

Seller eligibility, listing standards, prohibited listings, fees only when confirmed, buyer rights, seller obligations, payments/payout timing after processor confirmed, refund/returns rules, disputes, tax and recordkeeping guidance, moderation and account sanctions. Never claim Upet offers escrow/buyer protection if it does not.

### G. Refunds & Disputes `/legal/refunds`

Separate Upet service subscriptions, digital purchases and third-party seller transactions. Distinguish legal rights from discretionary refunds. Don't publish until the commerce model, payment processor and applicable law are established.

### H. IP reporting & Accessibility

Copyright/trademark notice-and-report pathway, proof requirements, counter-notification and fair review; accessible support channels, known limitations, feedback process, WCAG-aligned design goals without claiming certification.

### Publication gate

- Legal docs may be authored and previewed in staff portal as drafts.
- Public routes for unapproved text should display a factual `Policy being prepared` page, or the existing valid legal policy if already published; **do not silently replace previously approved terms**.
- Owner must fill `LEGAL_CONFIGURATION_CHECKLIST.md` and explicitly mark each policy approved before enabling it publicly.
- Record policy version, approved author, approval timestamp, effective date, and archival access to past versions.
- Show a review banner in staff preview until approval.

**Free official guidance to consult:**
- ICO privacy notice guide: https://ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies/how-to-write-a-privacy-notice-and-what-goes-in-it/
- ICO privacy details: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/
- ICO Children's code: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-code/
- GOV.UK online selling: https://www.gov.uk/online-and-distance-selling-for-businesses/online-selling

## 11. Proposed repository structure (adapt to actual code)

```text
help-app/
  src/
    app/                         # app shell and router
    components/
      ui/                        # existing shadcn/ui installed sources
      help/                      # HelpHeader, SearchBar, CategoryCard, ArticleCard
      tickets/                   # TicketForm, TicketStatus, TicketTimeline, ReplyComposer
      staff/                     # StaffSidebar, QueueFilters, NoteComposer, RoleGuard
      legal/                     # PolicyLayout, PolicyVersion, DraftBanner
    pages/
      HomePage.jsx
      SearchPage.jsx
      CategoryPage.jsx
      ArticlePage.jsx
      NewTicketPage.jsx
      MyTicketsPage.jsx
      TicketDetailPage.jsx
      LegalPolicyPage.jsx
      staff/StaffDashboardPage.jsx
      staff/StaffTicketInboxPage.jsx
      staff/StaffTicketDetailPage.jsx
      staff/StaffArticleEditorPage.jsx
      staff/StaffTeamPage.jsx
    features/
      auth/
      articles/
      tickets/
      staff/
      policies/
    lib/
      firebaseClient.js          # no server credentials
      validation.js
      routePermissions.js        # UI only, not security authority
      designTokens.css
    tests/
      tickets.test.*
      staff-permissions.test.*
      policy-publication.test.*
  server/                        # approved Cloud Functions / trusted API
    supportTickets.*
    staffRoles.*
    articlePublishing.*
  firestore.rules                # proposed, not auto-deployed
  storage.rules                  # proposed, not auto-deployed
  firestore.indexes.json
  LEGAL_CONFIGURATION_CHECKLIST.md
  HELP_CENTRE_PROGRESS.md
```

Never assume these paths exist: map the spec to the source repo and avoid duplicating an existing application or shared component library.

## 12. Implementation stages — individually verifiable

**Stage A — Source audit and scaffolding:** verify app, auth, project, DNS/deployment approach, no live changes; clean visual shell and routing.

**Stage B — Help Centre and articles:** public homepage, categories, article templates, article search, seed reviewed factual guides, mobile support.

**Stage C — Secure tickets:** persistent backend ticket data, protected user ticket list and thread, auth, attachment restrictions, validation and user flows.

**Stage D — Owner inbox:** role-enforced staff queue, owner public replies, internal notes, assignments, audit records, ticket state changes.

**Stage E — Legal pages:** structured drafts, admin preview, publication gates, configuration checklist, archive/versioning. Make existing approved pages persist until intentionally replaced.

**Stage F — Moderator-ready roles:** trust-backed capability matrix and role management, but don't grant any moderator access until owner authorises particular people. Implement least privilege and test denial paths.

**Stage G — QA and release readiness:** tests, accessibility, mobile, security emulator cases, build, preview deployment review, no production publication without explicit owner permission.

At each stage: report changed files, packages installed, tests, screenshots/preview route, blockers and what requires owner decision. Use `HELP_CENTRE_PROGRESS.md` as persistent checkpoint. Do not call a feature working if it's a mock.

## 13. Acceptance criteria

- Real help centre loads beautifully on desktop/mobile at `help.user.pet` **after approved deployment**.
- Working search finds only published help articles; public can read them without signing in.
- Authenticated users can submit, view and reply to their own real persisted tickets.
- Owners can receive, reply, assign, resolve and close tickets through staff portal.
- Staff notes stay private, roles are enforced on server, and authorization tests pass.
- Future moderators have scoped access; default is none. No email-only security.
- Legal policy pages have stable URLs and versioning; unapproved text is not misrepresented as final.
- No fake company/legal details, fabricated security guarantees or misleading refund policies.
- Component consistency from shadcn/ui, actual logo and Upet theme; no decorative inert buttons.
- Code builds, existing user.pet features work, no secrets leaked, and no production changes without owner approval.

## 14. Codex kickoff — use this short instruction after placing the file in the repo

> Read `UPET_HELP_CENTRE_TICKETS_AND_POLICIES.md` in full. Audit the existing Upet architecture and begin Stage A on a new feature branch. Build a beautiful help.user.pet site with working support-ticket architecture, owner-only staff access initially, and moderator-ready permissions. Preserve the live site and existing Firebase data. Legal content must stay draft pending verified operator details and explicit approval. Reuse official shadcn/ui components; implement and test each stage, record progress, and do not deploy or merge without permission.
