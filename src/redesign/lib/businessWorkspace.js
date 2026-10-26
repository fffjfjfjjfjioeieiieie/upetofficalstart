import { collection, doc, getDocs, limit, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, firestore } from '../../app/firebase.js';
import { cleanBusinessDetails } from '../../shared/businessDetails.js';
import { BUSINESS_PROGRAM_ENABLED } from '../../shared/featureFlags.js';

const requireBusinessProgram = () => {
  if (!BUSINESS_PROGRAM_ENABLED) throw new Error('The business programme is currently unavailable.');
};

export const businessRoles = ['owner', 'manager', 'editor', 'viewer'];

export async function listBusinessWorkspaces(uid) {
  requireBusinessProgram();
  if (!firestore || !uid) return [];
  const rows = await getDocs(query(collection(firestore, 'businesses'), where('memberUids', 'array-contains', uid), limit(20)));
  return rows.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export function watchBusiness(id, onChange, onError) {
  requireBusinessProgram();
  return onSnapshot(doc(firestore, 'businesses', id), (snapshot) => onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null), onError);
}

export async function createBusiness(user, input) {
  requireBusinessProgram();
  if (!firestore || !user?.uid || !user.username) throw new Error('Create a personal profile first.');
  const values = cleanBusinessDetails(input);
  const id = user.username;
  const businessRef = doc(firestore, 'businesses', id);
  await runTransaction(firestore, async (transaction) => {
    const [account, existing] = await Promise.all([transaction.get(doc(firestore, 'users', user.uid)), transaction.get(businessRef)]);
    if (account.data()?.username !== id) throw new Error('Your personal profile must be claimed first.');
    if (existing.exists()) throw new Error('This profile already owns a business workspace.');
    const now = serverTimestamp();
    transaction.set(businessRef, {
      ownerUid: user.uid, ownerUsername: id, name: values.businessName, description: values.description.slice(0, 500), category: values.category,
      website: values.website, status: 'active', memberUids: [user.uid],
      members: { [user.uid]: { email: user.email, username: id, role: 'owner' } }, createdAt: now, updatedAt: now,
    });
  });
  return id;
}

export async function saveBusinessDetails(id, changes) {
  requireBusinessProgram();
  const values = cleanBusinessDetails({ businessName: changes.name, category: changes.category, website: changes.website, description: changes.description });
  await updateDoc(doc(firestore, 'businesses', id), { name: values.businessName, description: values.description.slice(0, 500), category: values.category, website: values.website, updatedAt: serverTimestamp() });
}

export async function assignBusinessMember(id, { email, username, role }) {
  requireBusinessProgram();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in again to manage the team.');
  const response = await fetch('/api/business-team', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ businessId: id, email, username, role }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not update the team.');
  return result;
}

export async function removeBusinessMember(id, uid) {
  requireBusinessProgram();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in again to manage the team.');
  const response = await fetch('/api/business-team', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ businessId: id, uid }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not remove the member.');
  return result;
}
