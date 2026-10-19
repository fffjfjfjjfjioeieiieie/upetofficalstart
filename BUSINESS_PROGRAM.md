# Verified Business programme

The home page links to `/business-verification`, a dedicated application page. Signed-in founders with a personal account can apply; everyone else sees the programme and access requirements. Business mode at `/business` is separate from verification.

Applications are private Firestore documents in `businessApplications/{uid}`. The form collects business name, category, operating type, country, description, optional website, user.pet shop URL, owner role, support email, order fulfillment details, a separate public proof URL, and an explanation of how that URL connects the applicant to the business. It does not request private identity documents. A founder can edit a pending application or resubmit after rejection; they cannot approve themselves. Existing applications missing the expanded answers must be updated before approval.

Reviewers use Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT_JSON` or application-default credentials) and run:

```sh
node scripts/business-review.mjs list
node scripts/business-review.mjs approve <uid>
node scripts/business-review.mjs reject <uid>
```

Reviewers should inspect the public evidence and answers before approving. The approval command checks completeness, that the applicant still owns their published profile, and that either their personal or business shop is enabled. It writes a separate `verifiedBusinesses/{username}` record that the relevant shop page reads to show the verified mark. Client Firestore rules deny writes to verification records. Approval is manual and is never granted by the form itself.
