import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../app/firebase.js';

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,19}$/;

export class UsernameAlreadyTakenError extends Error {
  constructor(username) {
    super(`user.pet/${username} has already been claimed.`);
    this.name = 'UsernameAlreadyTakenError';
  }
}

export class UsernameAlreadyClaimedError extends Error {
  constructor(username) {
    super(`This account already owns user.pet/${username}.`);
    this.name = 'UsernameAlreadyClaimedError';
  }
}

export async function claimUsername(user, rawUsername) {
  if (!firestore) throw new Error('Username claiming is not configured yet.');
  if (!user?.uid) throw new Error('Sign in before claiming a username.');

  const username = rawUsername.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error('Use 3–20 characters: letters, numbers, dots, underscores, or hyphens.');
  }

  const usernameRef = doc(firestore, 'usernames', username);
  const accountRef = doc(firestore, 'users', user.uid);

  const result = await runTransaction(firestore, async (transaction) => {
    const [usernameSnapshot, accountSnapshot] = await Promise.all([
      transaction.get(usernameRef),
      transaction.get(accountRef),
    ]);

    if (accountSnapshot.exists()) {
      const existingUsername = accountSnapshot.data().username;
      if (existingUsername === username) return { username, alreadyOwned: true };
      throw new UsernameAlreadyClaimedError(existingUsername);
    }

    if (usernameSnapshot.exists()) throw new UsernameAlreadyTakenError(username);

    transaction.set(usernameRef, {
      uid: user.uid,
      username,
      createdAt: serverTimestamp(),
    });
    transaction.set(accountRef, {
      uid: user.uid,
      username,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { username, alreadyOwned: false };
  });

  return result;
}

export async function getAccountForUser(user) {
  if (!firestore || !user?.uid) return null;
  const snapshot = await getDoc(doc(firestore, 'users', user.uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function isUsernameAvailable(rawUsername) {
  if (!firestore) throw new Error('Username claiming is not configured yet.');
  const username = rawUsername.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) return false;
  const snapshot = await getDoc(doc(firestore, 'usernames', username));
  return !snapshot.exists();
}
