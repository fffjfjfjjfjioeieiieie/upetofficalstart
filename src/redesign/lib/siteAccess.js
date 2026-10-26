import { doc, getDoc } from 'firebase/firestore';
import { isApprovedFounder } from '../../app/FounderGate.jsx';
import { firestore } from '../../app/firebase.js';

const accessRequests = new Map();

export async function getSiteAccess(user) {
  if (!user?.uid || !user.email) return null;
  if (isApprovedFounder(user)) return { role: 'founder', source: 'founder' };
  if (!firestore) return null;
  const email = user.email.trim().toLowerCase();
  const key = `${user.uid}:${email}`;
  const cached = accessRequests.get(key);
  if (cached && Date.now() - cached.at < 3000) return cached.promise;
  const promise = getDoc(doc(firestore, 'accessInvites', email)).then((invite) => {
    const data = invite.exists() ? invite.data() : null;
    return data?.active === true && data?.role === 'member' ? { role: 'member', source: 'invite' } : null;
  });
  accessRequests.set(key, { at: Date.now(), promise });
  promise.catch(() => { if (accessRequests.get(key)?.promise === promise) accessRequests.delete(key); });
  if (accessRequests.size > 20) for (const [oldKey, value] of accessRequests) if (Date.now() - value.at >= 3000) accessRequests.delete(oldKey);
  return promise;
}
