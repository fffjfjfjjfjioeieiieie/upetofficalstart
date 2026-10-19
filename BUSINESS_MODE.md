# Business mode

Business mode uses a separate `businesses/{ownerUsername}` workspace and `businessShops/{ownerUsername}` storefront. The creator must first sign in with a personal account and claim a profile. The business belongs to that personal account; team members sign in with their own personal accounts and enter the same workspace at `/business`.

The owner can add an existing personal account by email, profile username, or both from the Team page. If both are provided, they must refer to the same account. The owner can change an employee's role or remove them. No shared password is needed. Business roles are:

- **Owner:** business settings, shop editing, and team management. Cannot be removed from the business.
- **Manager / Editor:** shop editing and product management.
- **Viewer:** read-only workspace access.

Team changes use `api/business-team.js`, which verifies the owner's Firebase token and checks ownership again inside a Firestore transaction. Client rules block changes to ownership, team membership, and roles. Shop edits are allowed only for owner, manager, or editor. A private business shop is available by its direct `/biz/{ownerUsername}` link once published; a public shop also appears in Marketplace.

The business mode and Verified Business programme are separate. Opening a business workspace does not grant verification. The existing manual review flow in `BUSINESS_PROGRAM.md` can approve a published personal or business shop.

For testing, `whatdidido6969@gmail.com` can create a personal account on the login page, verify its email, claim a profile, and then create a business workspace. Existing personal accounts can be assigned by the owner. Public personal-account registration remains closed.
