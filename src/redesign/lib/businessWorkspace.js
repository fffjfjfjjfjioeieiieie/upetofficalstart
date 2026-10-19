import { collection, doc, getDoc, getDocs, limit, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, firestore } from '../../app/firebase.js';
import { cleanBusinessApplication } from '../../shared/businessApplication.js';
import { DEFAULT_SHOP_DESIGN, sanitizeShopDesign, sanitizeShopProduct } from '../shop/shopModel.js';

export const businessRoles = ['owner', 'manager', 'editor', 'viewer'];
export const canEditBusinessShop = (role) => ['owner', 'manager', 'editor'].includes(role);

export async function listBusinessWorkspaces(uid) {
  if (!firestore || !uid) return [];
  const rows = await getDocs(query(collection(firestore, 'businesses'), where('memberUids', 'array-contains', uid), limit(20)));
  return rows.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export async function listPublicBusinessShops() {
  if (!firestore) return [];
  const rows = await getDocs(query(collection(firestore, 'businessShops'), where('enabled', '==', true), where('private', '==', false), limit(60)));
  return rows.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export function watchBusiness(id, onChange, onError) {
  return onSnapshot(doc(firestore, 'businesses', id), (snapshot) => onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null), onError);
}

export function watchBusinessShop(id, onChange, onError) {
  return onSnapshot(doc(firestore, 'businessShops', id), (snapshot) => onChange(snapshot.exists() ? snapshot.data() : null), onError);
}

export async function createBusiness(user, input) {
  if (!firestore || !user?.uid || !user.username) throw new Error('Create a personal profile first.');
  const values = cleanBusinessApplication(input);
  const id = user.username;
  const businessRef = doc(firestore, 'businesses', id);
  const shopRef = doc(firestore, 'businessShops', id);
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
    transaction.set(shopRef, { businessId: id, ownerUid: user.uid, enabled: false, private: true, name: values.businessName, description: values.description.slice(0, 500), currency: 'GBP', design: DEFAULT_SHOP_DESIGN, products: [], createdAt: now, updatedAt: now });
  });
  return id;
}

export async function saveBusinessDetails(id, changes) {
  const values = cleanBusinessApplication({ businessName: changes.name, category: changes.category, website: changes.website, description: changes.description });
  await updateDoc(doc(firestore, 'businesses', id), { name: values.businessName, description: values.description.slice(0, 500), category: values.category, website: values.website, updatedAt: serverTimestamp() });
}

export async function saveBusinessShop(id, input) {
  const products = (input.products || []).slice(0, 80).map((product, index) => sanitizeShopProduct(product, index));
  if (products.some((product) => !product.name.trim())) throw new Error('Every product needs a name.');
  const shop = {
    enabled: Boolean(input.enabled), private: Boolean(input.private), name: String(input.name || '').trim().slice(0, 100),
    description: String(input.description || '').trim().slice(0, 500), currency: ['GBP', 'USD', 'EUR'].includes(input.currency) ? input.currency : 'GBP',
    design: sanitizeShopDesign(input.design), products, updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(firestore, 'businessShops', id), shop);
  return shop;
}

export async function getPublicBusinessShop(id) {
  const shop = await getDoc(doc(firestore, 'businessShops', id));
  return shop.exists() ? shop.data() : null;
}

export async function assignBusinessMember(id, { email, username, role }) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in again to manage the team.');
  const response = await fetch('/api/business-team', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ businessId: id, email, username, role }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not update the team.');
  return result;
}

export async function removeBusinessMember(id, uid) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in again to manage the team.');
  const response = await fetch('/api/business-team', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ businessId: id, uid }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not remove the member.');
  return result;
}
