import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { firestore } from '../app/firebase.js';

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,19}$/;

function requireFirestore() {
  if (!firestore) throw new Error('Firebase Firestore is not configured.');
  return firestore;
}

function cleanUsername(value) {
  return String(value ?? '').trim().replace(/^@/, '').toLowerCase();
}

export async function findUserByUsername(rawUsername) {
  const db = requireFirestore();
  const username = cleanUsername(rawUsername);
  if (!USERNAME_PATTERN.test(username)) throw new Error('Enter a valid username, 3 to 20 characters.');

  const snapshot = await getDoc(doc(db, 'usernames', username));
  if (!snapshot.exists()) return null;
  const account = snapshot.data();
  if (!account?.uid) return null;
  return { uid: account.uid, username: account.username || username };
}

export function listenToFriends(uid, onChange, onError) {
  const db = requireFirestore();
  return onSnapshot(collection(db, 'friendships', uid, 'friends'), (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
  }, onError);
}

export function listenToIncomingRequests(uid, onChange, onError) {
  const db = requireFirestore();
  return onSnapshot(collection(db, 'friendRequests', uid, 'incoming'), (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
  }, onError);
}

export function listenToOutgoingRequests(uid, onChange, onError) {
  const db = requireFirestore();
  const outgoingQuery = query(collectionGroup(db, 'incoming'), where('fromUid', '==', uid));
  return onSnapshot(outgoingQuery, (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
  }, onError);
}

export async function sendFriendRequest(fromUid, toUid) {
  const db = requireFirestore();
  if (!fromUid || !toUid || fromUid === toUid) throw new Error('You cannot add your own account.');

  const senderAccountRef = doc(db, 'users', fromUid);
  const recipientAccountRef = doc(db, 'users', toUid);
  const outgoingRef = doc(db, 'friendRequests', toUid, 'incoming', fromUid);
  const incomingRef = doc(db, 'friendRequests', fromUid, 'incoming', toUid);
  const senderFriendRef = doc(db, 'friendships', fromUid, 'friends', toUid);

  return runTransaction(db, async (transaction) => {
    const [senderAccount, recipientAccount, outgoing, incoming, senderFriend] = await Promise.all([
      transaction.get(senderAccountRef),
      transaction.get(recipientAccountRef),
      transaction.get(outgoingRef),
      transaction.get(incomingRef),
      transaction.get(senderFriendRef),
    ]);

    if (!senderAccount.exists() || !recipientAccount.exists()) throw new Error('That account could not be found.');
    if (senderFriend.exists()) throw new Error('You are already friends.');
    if (incoming.exists() && incoming.data().status === 'pending') {
      throw new Error('They already sent you a request. Accept it below.');
    }
    if (outgoing.exists() && outgoing.data().status === 'pending') {
      throw new Error('Your friend request is already pending.');
    }
    if (outgoing.exists() && outgoing.data().status !== 'declined') {
      throw new Error('A request already exists for this account.');
    }

    const now = serverTimestamp();
    const requestData = {
      fromUid,
      fromUsername: senderAccount.data().username,
      toUid,
      toUsername: recipientAccount.data().username,
      status: 'pending',
      updatedAt: now,
    };

    if (outgoing.exists()) {
      transaction.update(outgoingRef, requestData);
    } else {
      transaction.set(outgoingRef, { ...requestData, createdAt: now });
    }
  });
}

export async function respondToFriendRequest(recipientUid, senderUid, accept) {
  const db = requireFirestore();
  const requestRef = doc(db, 'friendRequests', recipientUid, 'incoming', senderUid);
  const recipientFriendRef = doc(db, 'friendships', recipientUid, 'friends', senderUid);
  const senderFriendRef = doc(db, 'friendships', senderUid, 'friends', recipientUid);

  return runTransaction(db, async (transaction) => {
    const [requestSnapshot, recipientFriend] = await Promise.all([
      transaction.get(requestRef),
      transaction.get(recipientFriendRef),
    ]);
    if (!requestSnapshot.exists() || requestSnapshot.data().status !== 'pending') {
      throw new Error('This request is no longer pending.');
    }
    if (recipientFriend.exists()) throw new Error('You are already friends.');

    const requestData = requestSnapshot.data();
    transaction.update(requestRef, {
      status: accept ? 'accepted' : 'declined',
      updatedAt: serverTimestamp(),
    });

    if (accept) {
      transaction.set(recipientFriendRef, {
        uid: recipientUid,
        friendUid: senderUid,
        friendUsername: requestData.fromUsername,
        createdAt: serverTimestamp(),
      });
      transaction.set(senderFriendRef, {
        uid: senderUid,
        friendUid: recipientUid,
        friendUsername: requestData.toUsername,
        createdAt: serverTimestamp(),
      });
    }
  });
}

export async function ensureFriendChat(uid, friendUid) {
  const db = requireFirestore();
  if (!uid || !friendUid || uid === friendUid) throw new Error('Choose one of your friends to start a chat.');
  const [memberA, memberB] = [uid, friendUid].sort();
  const room = { memberA, memberB, roomId: `${memberA}__${memberB}` };
  const chatRef = doc(db, 'chats', memberA, 'with', memberB);
  const friendshipRef = doc(db, 'friendships', uid, 'friends', friendUid);

  await runTransaction(db, async (transaction) => {
    const [chatSnapshot, friendshipSnapshot] = await Promise.all([
      transaction.get(chatRef),
      transaction.get(friendshipRef),
    ]);
    if (!friendshipSnapshot.exists()) throw new Error('Chat is only available between friends.');
    if (chatSnapshot.exists()) {
      const members = chatSnapshot.data().members || [];
      if (!members.includes(uid) || !members.includes(friendUid)) throw new Error('This chat is not available.');
      return;
    }
    transaction.set(chatRef, { members: [memberA, memberB], createdAt: serverTimestamp() });
  });

  return room;
}

export function listenToMessages(room, onChange, onError) {
  const db = requireFirestore();
  const messagesQuery = query(
    collection(db, 'chats', room.memberA, 'with', room.memberB, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(100),
  );
  return onSnapshot(messagesQuery, (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).reverse());
  }, onError);
}

export function listenToTyping(room, friendUid, onChange, onError) {
  const db = requireFirestore();
  const typingRef = doc(db, 'chats', room.memberA, 'with', room.memberB, 'typing', friendUid);
  let expiryTimer;

  const unsubscribe = onSnapshot(typingRef, (snapshot) => {
    clearTimeout(expiryTimer);
    const isTyping = snapshot.exists() && snapshot.data().isTyping === true;
    onChange(isTyping);

    // Clear abandoned indicators if the other person closes their tab or loses connection.
    if (isTyping) expiryTimer = setTimeout(() => onChange(false), 6500);
  }, onError);

  return () => {
    clearTimeout(expiryTimer);
    unsubscribe();
  };
}

export async function setChatTyping(room, uid, isTyping) {
  const db = requireFirestore();
  const typingRef = doc(db, 'chats', room.memberA, 'with', room.memberB, 'typing', uid);
  await setDoc(typingRef, { isTyping: Boolean(isTyping), updatedAt: serverTimestamp() });
}

export async function sendChatMessage(room, senderUid, rawText) {
  const db = requireFirestore();
  const text = String(rawText ?? '').trim();
  if (!text) throw new Error('Write a message first.');
  if (text.length > 2000) throw new Error('Messages can be up to 2,000 characters.');
  await addDoc(collection(db, 'chats', room.memberA, 'with', room.memberB, 'messages'), {
    senderId: senderUid,
    text,
    createdAt: serverTimestamp(),
  });
}
