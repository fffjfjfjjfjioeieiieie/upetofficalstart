import { FieldValue } from 'firebase-admin/firestore';
import { database } from '../server/visitorStore.js';
import { cleanBusinessApplication } from '../src/shared/businessApplication.js';

const [action, uid] = process.argv.slice(2);
const db = database();

if (action === 'list') {
  const snapshot = await db.collection('businessApplications').where('status', '==', 'pending').get();
  for (const entry of snapshot.docs) {
    const row = entry.data();
    console.log(JSON.stringify({ uid: entry.id, username: row.username, businessName: row.businessName, category: row.category, website: row.website, description: row.description, businessType: row.businessType, country: row.country, shopUrl: row.shopUrl, publicProofUrl: row.publicProofUrl, proofExplanation: row.proofExplanation, ownerRole: row.ownerRole, supportEmail: row.supportEmail, fulfillment: row.fulfillment, contactEmail: row.contactEmail }));
  }
  if (snapshot.empty) console.log('No pending applications.');
} else if (['approve', 'reject'].includes(action) && uid) {
  const applicationRef = db.collection('businessApplications').doc(uid);
  await db.runTransaction(async (transaction) => {
    const application = await transaction.get(applicationRef);
    if (!application.exists || application.data().status !== 'pending') throw new Error('Pending application not found.');
    const row = application.data();
    if (action === 'approve') cleanBusinessApplication(row, row.username);
    const profileRef = db.collection('profiles').doc(row.username);
    const profile = await transaction.get(profileRef);
    if (!profile.exists || profile.data().ownerUid !== uid) throw new Error('The applicant no longer owns this profile.');
    transaction.update(applicationRef, { status: action === 'approve' ? 'approved' : 'rejected', reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    if (action === 'approve') transaction.set(db.collection('verifiedBusinesses').doc(row.username), { username: row.username, ownerUid: uid, businessName: row.businessName, category: row.category, status: 'approved', verifiedAt: FieldValue.serverTimestamp() });
  });
  console.log(`${action === 'approve' ? 'Approved' : 'Rejected'} ${uid}.`);
} else {
  console.error('Usage: node scripts/business-review.mjs list | approve <uid> | reject <uid>');
  process.exitCode = 1;
}
