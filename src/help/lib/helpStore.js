import { addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, startAfter, updateDoc, where, writeBatch } from 'firebase/firestore';
import { firestore } from '../../app/firebase';
import { isApprovedFounder } from '../../app/FounderGate';
import { boundedQueryLimit, firestorePage } from '../../shared/data/queryPolicy.js';

const ticketRef = (id) => doc(firestore, 'supportTickets', id);
const messagesRef = (id) => collection(ticketRef(id), 'messages');
const auditRef = (id) => collection(ticketRef(id), 'audit');

export const TICKET_CATEGORIES = ['Account access', 'Profile editor', 'Bugs', 'Safety/Abuse', 'Other'];
export const TICKET_STATUSES = ['open', 'in_progress', 'waiting_on_user', 'resolved', 'closed'];
export const statusLabel = (status) => ({ open: 'Open', in_progress: 'In progress', waiting_on_user: 'Waiting on you', resolved: 'Resolved', closed: 'Closed' }[status] || status);

export async function ensureOwnerMembership(user) {
  if (!firestore || !user?.uid) return null;
  const ref = doc(firestore, 'supportStaff', user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return snapshot.data();
  if (!isApprovedFounder(user)) return null;
  try {
    await setDoc(ref, { uid: user.uid, role: 'owner', capabilities: ['tickets:all', 'tickets:reply', 'tickets:assign', 'articles:publish', 'legal:manage', 'team:manage'], active: true, createdAt: serverTimestamp(), addedBy: user.uid });
    return (await getDoc(ref)).data();
  } catch (error) { console.error('Founder support membership could not be created:', error); return null; }
}

export function subscribeStaffMembership(uid, onChange) {
  if (!firestore || !uid) return () => {};
  return onSnapshot(doc(firestore, 'supportStaff', uid), (snapshot) => onChange(snapshot.exists() ? snapshot.data() : null), (error) => { console.error('Staff membership subscription failed:', error); onChange(null); });
}

export async function createTicket(user, input) {
  const ref = doc(collection(firestore, 'supportTickets'));
  const reference = `UP-${new Date().getFullYear()}-${ref.id.slice(0, 6).toUpperCase()}`;
  const batch = writeBatch(firestore);
  const now = serverTimestamp();
  batch.set(ref, { reference, requesterUid: user.uid, requesterEmail: user.email || '', subject: input.subject.trim(), category: input.category, status: 'open', priority: 'normal', assignedToUid: '', tags: [], resolutionSummary: '', createdAt: now, updatedAt: now, lastPublicMessageAt: now });
  batch.set(doc(messagesRef(ref.id)), { authorUid: user.uid, authorRole: 'user', visibility: 'public', body: input.description.trim(), attachments: [], createdAt: now, editedAt: null });
  batch.set(doc(auditRef(ref.id)), { actorUid: user.uid, action: 'ticket_created', changes: { status: 'open' }, createdAt: now });
  await batch.commit();
  return { id: ref.id, reference };
}

function ticketPageQuery({ uid = '', cursor = null, pageSize } = {}) {
  const size = boundedQueryLimit('supportTickets', pageSize);
  const constraints = [];
  if (uid) constraints.push(where('requesterUid', '==', uid));
  constraints.push(orderBy('updatedAt', 'desc'));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(size + 1));
  return { source: query(collection(firestore, 'supportTickets'), ...constraints), size };
}

export function subscribeMyTickets(uid, onChange, onError, pageSize) {
  const pageQuery = ticketPageQuery({ uid, pageSize });
  return onSnapshot(pageQuery.source, (snapshot) => { const page = firestorePage(snapshot, pageQuery.size); onChange(page.items, page); }, onError);
}

export function subscribeStaffTickets(onChange, onError, pageSize) {
  const pageQuery = ticketPageQuery({ pageSize });
  return onSnapshot(pageQuery.source, (snapshot) => { const page = firestorePage(snapshot, pageQuery.size); onChange(page.items, page); }, onError);
}

export async function getOlderTickets({ uid = '', cursor, pageSize } = {}) {
  const pageQuery = ticketPageQuery({ uid, cursor, pageSize });
  return firestorePage(await getDocs(pageQuery.source), pageQuery.size);
}

export function subscribeTicket(id, onChange, onError) {
  return onSnapshot(ticketRef(id), (snapshot) => onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null), onError);
}

function messagePageQuery(id, staff, { cursor = null, pageSize } = {}) {
  const size = boundedQueryLimit('ticketMessages', pageSize);
  const constraints = [];
  if (!staff) constraints.push(where('visibility', '==', 'public'));
  constraints.push(orderBy('createdAt', 'desc'));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(size + 1));
  return { source: query(messagesRef(id), ...constraints), size };
}

export function subscribeMessages(id, staff, onChange, onError, pageSize) {
  const pageQuery = messagePageQuery(id, staff, { pageSize });
  return onSnapshot(pageQuery.source, (snapshot) => { const page = firestorePage(snapshot, pageQuery.size, { reverse: true }); onChange(page.items, page); }, onError);
}

export async function getOlderMessages(id, staff, cursor, pageSize) {
  const pageQuery = messagePageQuery(id, staff, { cursor, pageSize });
  return firestorePage(await getDocs(pageQuery.source), pageQuery.size, { reverse: true });
}

export async function sendTicketMessage(ticket, user, body, { staff = false, internal = false, role = 'owner' } = {}) {
  const text = String(body || '').trim();
  if (!text) return;
  const batch = writeBatch(firestore);
  const now = serverTimestamp();
  batch.set(doc(messagesRef(ticket.id)), { authorUid: user.uid, authorRole: staff ? role : 'user', visibility: internal ? 'internal' : 'public', body: text.slice(0, 5000), attachments: [], createdAt: now, editedAt: null });
  const ticketUpdate = { updatedAt: now };
  if (!internal) ticketUpdate.lastPublicMessageAt = now;
  if (!staff && ticket.status === 'resolved') ticketUpdate.status = 'open';
  if (staff && !internal && ticket.status === 'open') ticketUpdate.status = 'waiting_on_user';
  batch.update(ticketRef(ticket.id), ticketUpdate);
  batch.set(doc(auditRef(ticket.id)), { actorUid: user.uid, action: internal ? 'internal_note_added' : 'public_reply_added', changes: {}, createdAt: now });
  await batch.commit();
}

export async function updateTicketByStaff(ticketId, user, changes) {
  const safe = Object.fromEntries(Object.entries(changes).filter(([key]) => ['status', 'priority', 'assignedToUid', 'category', 'tags', 'resolutionSummary'].includes(key)));
  const batch = writeBatch(firestore); const now = serverTimestamp();
  batch.update(ticketRef(ticketId), { ...safe, updatedAt: now });
  batch.set(doc(auditRef(ticketId)), { actorUid: user.uid, action: 'ticket_updated', changes: safe, createdAt: now });
  await batch.commit();
}

export async function saveHelpArticle(article, user) {
  await setDoc(doc(firestore, 'helpArticles', article.slug), { ...article, authorUid: user.uid, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveLegalDraft(slug, data, user) {
  await setDoc(doc(firestore, 'helpLegalDocuments', slug), { ...data, slug, approved: false, reviewState: 'draft', updatedAt: serverTimestamp(), updatedBy: user.uid }, { merge: true });
}
