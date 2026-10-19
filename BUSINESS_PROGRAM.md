# Verified Business programme

The home page shows a locked programme preview to visitors. Signed-in founders can apply with a business name, category, website, and short description. Applications are private Firestore documents in `businessApplications/{uid}`. A founder can edit a pending application or resubmit after rejection; they cannot approve themselves.

Reviewers use Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT_JSON` or application-default credentials) and run:

```sh
node scripts/business-review.mjs list
node scripts/business-review.mjs approve <uid>
node scripts/business-review.mjs reject <uid>
```

Approval checks that the applicant still owns their published profile and has enabled either their personal shop or business shop. It writes a separate `verifiedBusinesses/{username}` record that the relevant shop page reads to show the verified mark. Client Firestore rules deny writes to verification records. Approval is manual and is never granted by the application form itself.
