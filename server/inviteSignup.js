import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';

export function normalizeInviteEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  return email;
}

export function validateSignupPassword(value) {
  const password = String(value || '');
  if (password.length < 12) throw new Error('Use a password with at least 12 characters.');
  return password;
}

// Auth and Firestore cannot share a transaction. Reserve the one-time invite,
// create a fixed Auth UID, then release the invite if Auth creation fails.
export async function createInvitedAccount({ db, auth, email: inputEmail, password, uid = randomUUID() }) {
  const email = normalizeInviteEmail(inputEmail);
  validateSignupPassword(password);
  const inviteRef = db.collection('accessInvites').doc(email);
  let reserved = false;

  await db.runTransaction(async (transaction) => {
    const invite = await transaction.get(inviteRef);
    const data = invite.data();
    if (!invite.exists || data?.active !== true || data?.role !== 'member' || data?.consumedBy) {
      throw new Error('There is no unused active invitation for this email.');
    }
    transaction.update(inviteRef, { consumedBy: uid, consumedAt: FieldValue.serverTimestamp() });
    reserved = true;
  });

  try {
    const user = await auth.createUser({ uid, email, password, emailVerified: false, disabled: false });
    await auth.setCustomUserClaims(user.uid, { member: true });
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email,
      role: 'member',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { uid: user.uid, email };
  } catch (error) {
    await auth.deleteUser?.(uid).catch(() => {});
    if (reserved) {
      await db.runTransaction(async (transaction) => {
        const invite = await transaction.get(inviteRef);
        if (invite.data()?.consumedBy === uid) {
          transaction.update(inviteRef, { consumedBy: FieldValue.delete(), consumedAt: FieldValue.delete() });
        }
      }).catch(() => {});
    }
    throw error;
  }
}
