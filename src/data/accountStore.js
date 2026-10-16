import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../app/firebase.js';
import { canClaimSpecialUsername, normalizeUsername } from '../shared/username.js';
export { normalizeUsername } from '../shared/username.js';

export class UsernameAlreadyTakenError extends Error {
  constructor(username) { super(`user.pet/${username} has already been claimed.`); this.name = 'UsernameAlreadyTakenError'; }
}

export class UsernameAlreadyClaimedError extends Error {
  constructor(username) { super(`This account already owns user.pet/${username}.`); this.name = 'UsernameAlreadyClaimedError'; }
}

export async function claimUsername(user, rawUsername) {
  if (!firestore) throw new Error('Username claiming is not configured yet.');
  if (!user?.uid) throw new Error('Sign in before claiming a username.');
  const username = normalizeUsername(rawUsername);
  if (!canClaimSpecialUsername(username, user.email)) throw new UsernameAlreadyTakenError(username);

  const usernameRef = doc(firestore, 'usernames', username);
  const accountRef = doc(firestore, 'users', user.uid);
  const profileRef = doc(firestore, 'profiles', username);
  return runTransaction(firestore, async (transaction) => {
    const [usernameSnapshot, accountSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(usernameRef), transaction.get(accountRef), transaction.get(profileRef),
    ]);
    if (accountSnapshot.exists()) {
      const existingUsername = accountSnapshot.data().username;
      if (existingUsername === username) {
        if (usernameSnapshot.exists() && usernameSnapshot.data().uid !== user.uid) throw new UsernameAlreadyTakenError(username);
        if (!usernameSnapshot.exists()) transaction.set(usernameRef, { uid: user.uid, username, createdAt: serverTimestamp() });
        const accountRepair = {
          uid: user.uid,
          email: String(user.email || '').toLowerCase(),
          role: 'founder',
          updatedAt: serverTimestamp(),
        };
        if (!accountSnapshot.data().createdAt) accountRepair.createdAt = serverTimestamp();
        transaction.update(accountRef, accountRepair);
        return { username, alreadyOwned: true };
      }
      throw new UsernameAlreadyClaimedError(existingUsername);
    }
    if ((usernameSnapshot.exists() && usernameSnapshot.data().uid !== user.uid) || (profileSnapshot.exists() && (profileSnapshot.data().ownerUid || profileSnapshot.data().uid) !== user.uid)) throw new UsernameAlreadyTakenError(username);
    if (!usernameSnapshot.exists()) transaction.set(usernameRef, { uid: user.uid, username, createdAt: serverTimestamp() });
    transaction.set(accountRef, { uid: user.uid, email: String(user.email || '').toLowerCase(), role: 'founder', username, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { username, alreadyOwned: false };
  });
}

export async function getAccountForUser(user) {
  if (!firestore || !user?.uid) return null;
  const snapshot = await getDoc(doc(firestore, 'users', user.uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function isUsernameAvailable(rawUsername, user) {
  if (!firestore) throw new Error('Username claiming is not configured yet.');
  let username;
  try { username = normalizeUsername(rawUsername); } catch { return false; }
  const [claim, profile] = await Promise.all([
    getDoc(doc(firestore, 'usernames', username)), getDoc(doc(firestore, 'profiles', username)),
  ]);
  if (claim.exists()) return claim.data().uid === user?.uid;
  if (profile.exists()) return (profile.data().ownerUid || profile.data().uid) === user?.uid;
  return true;
}
