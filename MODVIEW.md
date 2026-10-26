# Staff modview

Modview lives inside the main account dashboard at `/dashboard/modview`. It uses the same ticket records as the Help Centre, so staff can open and manage tickets without switching sites. The Help Centre staff route redirects to its Modview view for compatibility. Founders with an approved personal account can bootstrap their own owner membership; other people need an owner-assigned `supportStaff/{uid}` role.

- **Support agent:** ticket inbox, replies, assignments, internal notes, and safety-report tickets.
- **Moderator:** support tools plus account/profile review, business listings, and application review (without approval actions).
- **Support admin:** moderator tools plus badge grants and business verification decisions.
- **Owner:** all tools, people-application decisions, staff ranks, departments, job titles, activation, member access invitations, and audit history.

Safety reports use the existing private `Safety/Abuse` ticket category. People who want to join staff can apply at `/join-team`; approval records the decision but does not grant access until an owner assigns a role. Business verification approvals require the full application, profile ownership, and an active personal or business shop.

Modview’s privileged actions run through `/api/modview`, which verifies a Firebase ID token and checks the current staff membership on every request. Mutations write a `moderationAudit` record in the same transaction or batch. Public badge grants live in `profileBadgeGrants`; profile owners cannot forge official badges in their saved profile. Profile restriction hides public profile and shop views, removes the directory listing, and blocks owner publishing until lifted. Reasons are kept in staff-only `moderationCases`, while the public `moderationProfiles` record contains status only.

Founders can grant an email the separate `member` role from Founder controls → Member access. The invited person creates a personal account using that same verified email. This does not grant staff permissions; owners assign a separate staff rank after the account is created. Revoking an invitation blocks member sign-in and site writes, and active dashboard sessions sign out when the invite is revoked.

The main login page supports invitation-only account creation and verification. Firestore checks member invitations on account/profile/business writes. Visitor analytics stay founder-only and are not exposed by Modview.

Current queues return up to 50 records per section (60 for overview counts); Modview labels counts when this limit is reached. Search by username or email is available for individual account review. This release does not alter Firebase Authentication user credentials or delete accounts.
