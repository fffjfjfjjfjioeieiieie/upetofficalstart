import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../app/firebase.js';
import { profileDraftV2Schema } from '../../../shared/contracts/profileV2.js';

export async function loadOwnerDraftV2(uid) {
  if (!firestore || !uid) throw new Error('Firebase is unavailable for this Studio session.');
  const snapshot = await getDoc(doc(firestore, 'profileV2Drafts', uid));
  if (!snapshot.exists()) return null;
  const draft = profileDraftV2Schema.parse(snapshot.data());
  if (draft.ownerUid !== uid) throw new Error('The draft is not owned by this account.');
  return draft;
}

export async function submitStudioV2Action(firebaseUser, body) {
  if (!firebaseUser) throw new Error('Sign in before using Studio.');
  const token = await firebaseUser.getIdToken();
  const response = await fetch('/api/v2-profile', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error('The Studio preview API is unavailable. Draft changes are still only on this device.'); }
  if (!response.ok) {
    const error = new Error(payload?.error || `Studio request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
}
