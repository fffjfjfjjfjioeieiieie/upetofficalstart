import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { firestore } from '../../app/firebase.js';

const threadRef = (id) => doc(firestore, 'shopConversations', id);
const messageRef = (id) => collection(threadRef(id), 'messages');

export async function beginShopConversation(ownerUsername, guestName, guestContact, body) {
  if (!firestore) throw new Error('Chat is not configured yet.');
  const name = String(guestName || '').trim(); const text = String(body || '').trim();
  if (!name || !text) throw new Error('Enter your name and a message.');
  const thread = await addDoc(collection(firestore, 'shopConversations'), { ownerUsername, guestName: name.slice(0, 80), guestContact: String(guestContact || '').trim().slice(0, 240), lastMessage: text.slice(0, 2000), lastSender: 'guest', unreadForOwner: true, unreadForGuest: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await addDoc(messageRef(thread.id), { sender: 'guest', body: text.slice(0, 2000), createdAt: serverTimestamp() });
  return thread.id;
}

export function subscribeConversation(id, onChange, onError) { return onSnapshot(threadRef(id), (snapshot) => onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null), onError); }
export function subscribeOwnerConversations(username, onChange, onError) { return onSnapshot(query(collection(firestore, 'shopConversations'), where('ownerUsername', '==', username)), (snapshot) => onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0))), onError); }
export function subscribeConversationMessages(id, onChange, onError) { return onSnapshot(query(messageRef(id), orderBy('createdAt', 'asc')), (snapshot) => onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))), onError); }
export async function sendConversationMessage(id, sender, body) {
  const text = String(body || '').trim(); if (!text) return;
  await addDoc(messageRef(id), { sender, body: text.slice(0, 2000), createdAt: serverTimestamp() });
  await updateDoc(threadRef(id), { lastMessage: text.slice(0, 2000), lastSender: sender, unreadForOwner: sender === 'guest', unreadForGuest: sender === 'owner', updatedAt: serverTimestamp() });
}
