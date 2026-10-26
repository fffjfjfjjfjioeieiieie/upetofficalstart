import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '../../app/firebase.js';
import { cleanBusinessApplication } from '../../shared/businessApplication.js';
import { BUSINESS_PROGRAM_ENABLED } from '../../shared/featureFlags.js';

const requireBusinessProgram = () => {
  if (!BUSINESS_PROGRAM_ENABLED) throw new Error('The business programme is currently unavailable.');
};

export async function getBusinessApplication(uid) {
  requireBusinessProgram();
  if (!firestore || !uid) return null;
  const snapshot = await getDoc(doc(firestore, 'businessApplications', uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function submitBusinessApplication(authUser, username, input) {
  requireBusinessProgram();
  if (!firestore || !authUser?.uid || !username) throw new Error('Sign in with a founder profile first.');
  const values = cleanBusinessApplication(input, username);
  const reference = doc(firestore, 'businessApplications', authUser.uid);
  const current = await getDoc(reference);
  if (current.data()?.status === 'approved') throw new Error('Your business is already approved.');
  await setDoc(reference, {
    ownerUid: authUser.uid,
    username,
    ...values,
    contactEmail: authUser.email || '',
    status: 'pending',
    createdAt: current.exists() ? current.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...values, status: 'pending' };
}

export async function getVerifiedBusiness(username) {
  requireBusinessProgram();
  if (!firestore || !username) return null;
  const snapshot = await getDoc(doc(firestore, 'verifiedBusinesses', username));
  const data = snapshot.exists() ? snapshot.data() : null;
  return data?.status === 'approved' && data.username === username ? data : null;
}
