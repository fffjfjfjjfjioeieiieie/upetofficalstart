import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { firestore } from '../../app/firebase.js';

const messages = () => collection(firestore, 'shopMessages');

export async function sendShopMessage(ownerUsername, { senderName, senderContact, body }) {
  if (!firestore) throw new Error('Messaging is not configured yet.');
  const name = String(senderName || '').trim();
  const contact = String(senderContact || '').trim();
  const text = String(body || '').trim();
  if (!name || !text) throw new Error('Enter your name and a message.');
  await addDoc(messages(), { ownerUsername, senderName: name.slice(0, 80), senderContact: contact.slice(0, 240), body: text.slice(0, 2000), read: false, createdAt: serverTimestamp() });
}

export function subscribeShopMessages(ownerUsername, onChange, onError) {
  if (!firestore || !ownerUsername) return () => {};
  return onSnapshot(query(messages(), where('ownerUsername', '==', ownerUsername), orderBy('createdAt', 'desc')), (snapshot) => onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), onError);
}

export async function markShopMessageRead(id, read = true) {
  if (!firestore || !id) return;
  await updateDoc(doc(firestore, 'shopMessages', id), { read: Boolean(read) });
}
