import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { createEmptyProfileDocumentV2, createProfileDraftV2 } from '../src/shared/contracts/index.js';
import { createFirestoreProfileV2Repository } from '../server/v2/firestoreProfileRepository.js';

const projectId = 'demo-upet-v2';
let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});

after(async () => environment?.cleanup());
beforeEach(async () => environment.clearFirestore());

const ownerContext = () => environment.authenticatedContext('owner-a', { email: 'owner@example.com' });
const otherContext = () => environment.authenticatedContext('owner-b', { email: 'other@example.com' });
const anonymousContext = () => environment.unauthenticatedContext();

async function seed(values) {
  await environment.withSecurityRulesDisabled(async (context) => {
    await Promise.all(Object.entries(values).map(([path, value]) => setDoc(doc(context.firestore(), path), value)));
  });
}

test('v2 canonical data and drafts are owner-private and browser writes fail closed', async () => {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner-a', username: 'safe-user', nowMs: 1_000 });
  const draft = createProfileDraftV2(profile, { nowMs: 1_000 });
  await seed({
    'profileV2Canonical/safe-user': { ...profile, status: 'published', revision: 1 },
    'profileV2Drafts/owner-a': draft,
  });

  await assertSucceeds(getDoc(doc(ownerContext().firestore(), 'profileV2Canonical/safe-user')));
  await assertSucceeds(getDoc(doc(ownerContext().firestore(), 'profileV2Drafts/owner-a')));
  await assertFails(getDoc(doc(otherContext().firestore(), 'profileV2Canonical/safe-user')));
  await assertFails(getDoc(doc(otherContext().firestore(), 'profileV2Drafts/owner-a')));
  await assertFails(getDoc(doc(anonymousContext().firestore(), 'profileV2Drafts/owner-a')));
  await assertFails(setDoc(doc(ownerContext().firestore(), 'profileV2Drafts/owner-a'), draft));
});

test('only allowlisted public projections are anonymously readable and directory scans are bounded', async () => {
  await seed({
    'profileV2Public/safe-user': { schemaVersion: 2, username: 'safe-user', revision: 1 },
    'profileV2Directory/safe-user': { schemaVersion: 2, username: 'safe-user', revision: 1 },
    'profileV2PublicLyrics/safe-user_track-one': { schemaVersion: 1, trackId: 'track-one', revision: 1 },
  });
  const db = anonymousContext().firestore();
  const publicSnapshot = await assertSucceeds(getDoc(doc(db, 'profileV2Public/safe-user')));
  assert.equal(publicSnapshot.data().ownerUid, undefined);
  await assertSucceeds(getDoc(doc(db, 'profileV2Directory/safe-user')));
  await assertFails(getDocs(collection(db, 'profileV2Public')));
  await assertFails(getDoc(doc(db, 'profileV2PublicLyrics/safe-user_track-one')));
  await assertSucceeds(getDocs(query(collection(db, 'profileV2Directory'), limit(60))));
  await assertFails(getDocs(query(collection(db, 'profileV2Directory'), limit(61))));
  await assertFails(setDoc(doc(ownerContext().firestore(), 'profileV2Public/unsafe'), { ownerUid: 'owner-a' }));
});

test('revision recovery and private libraries require owner filters and bounded pages', async () => {
  await seed({
    'profileV2Revisions/safe-user_1': { ownerUid: 'owner-a', username: 'safe-user', revision: 1 },
    'profileV2Tracks/track-one': { ownerUid: 'owner-a', id: 'track-one' },
    'profileV2Assets/asset-one': { ownerUid: 'owner-a', id: 'asset-one' },
  });
  const ownerDb = ownerContext().firestore();
  await assertSucceeds(getDoc(doc(ownerDb, 'profileV2Revisions/safe-user_1')));
  await assertFails(getDoc(doc(otherContext().firestore(), 'profileV2Revisions/safe-user_1')));
  await assertSucceeds(getDocs(query(collection(ownerDb, 'profileV2Revisions'), where('ownerUid', '==', 'owner-a'), limit(50))));
  await assertFails(getDocs(query(collection(ownerDb, 'profileV2Revisions'), where('ownerUid', '==', 'owner-a'), limit(51))));
  await assertSucceeds(getDocs(query(collection(ownerDb, 'profileV2Tracks'), where('ownerUid', '==', 'owner-a'), limit(100))));
  await assertFails(getDocs(query(collection(ownerDb, 'profileV2Tracks'), where('ownerUid', '==', 'owner-a'), limit(101))));
});

test('founder authority comes from claims rather than a matching email', async () => {
  const claimed = environment.authenticatedContext('founder-a', { roles: ['founder'], email: 'unlisted@example.com' }).firestore();
  const emailOnly = environment.authenticatedContext('email-only', { email: 'zurihcs@gmail.com', email_verified: true }).firestore();
  const membership = (uid) => ({ uid, role: 'owner', capabilities: [], active: true, createdAt: serverTimestamp(), addedBy: uid });
  await assertSucceeds(setDoc(doc(claimed, 'supportStaff/founder-a'), membership('founder-a')));
  await assertFails(setDoc(doc(emailOnly, 'supportStaff/email-only'), membership('email-only')));
});

test('trusted repository publishes atomically in the emulator while rules expose only projections', async () => {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner-a', username: 'safe-user', nowMs: 1_000 });
  profile.identity.displayName = 'Safe User';
  const draft = createProfileDraftV2(profile, { basePublishedRevision: 0, nowMs: 1_000 });
  let trustedDb;
  await environment.withSecurityRulesDisabled(async (context) => {
    trustedDb = context.firestore();
    await setDoc(doc(trustedDb, 'profileV2Drafts/owner-a'), draft);
    await setDoc(doc(trustedDb, 'usernames/safe-user'), { uid: 'owner-a', username: 'safe-user' });
    await setDoc(doc(trustedDb, 'users/owner-a'), { uid: 'owner-a', username: 'safe-user' });
    const adapter = {
      doc: (path) => doc(trustedDb, path),
      runTransaction: (callback) => runTransaction(trustedDb, (transaction) => callback(transaction)),
    };
    const result = await createFirestoreProfileV2Repository({ db: adapter, now: () => 2_000 })
      .publish({ actor: { uid: 'owner-a' }, username: 'safe-user' });
    assert.equal(result.revision, 1);
  });

  const anonymousDb = anonymousContext().firestore();
  await assertSucceeds(getDoc(doc(anonymousDb, 'profileV2Public/safe-user')));
  await assertFails(getDoc(doc(anonymousDb, 'profileV2Canonical/safe-user')));
  const revision = await assertSucceeds(getDoc(doc(ownerContext().firestore(), 'profileV2Revisions/safe-user_1')));
  assert.equal(revision.data().document.identity.displayName, 'Safe User');
});

test('trusted draft save writes only a private draft and rejects a stale editor revision', async () => {
  const profile = createEmptyProfileDocumentV2({ ownerUid: 'owner-a', username: 'safe-user', nowMs: 1_000 });
  await seed({
    'usernames/safe-user': { uid: 'owner-a', username: 'safe-user' },
    'users/owner-a': { uid: 'owner-a', username: 'safe-user' },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    const trustedDb = context.firestore();
    const adapter = {
      doc: (path) => doc(trustedDb, path),
      runTransaction: (callback) => runTransaction(trustedDb, (transaction) => callback(transaction)),
    };
    const repository = createFirestoreProfileV2Repository({ db: adapter, now: () => 2_000 });
    const request = { actor: { uid: 'owner-a' }, username: 'safe-user', profile, basePublishedRevision: 0, expectedDraftRevision: 0 };
    assert.equal((await repository.saveDraft(request)).draftRevision, 1);
    await assert.rejects(repository.saveDraft(request), /revision conflict/i);
  });
  await assertSucceeds(getDoc(doc(ownerContext().firestore(), 'profileV2Drafts/owner-a')));
  await assertFails(getDoc(doc(otherContext().firestore(), 'profileV2Drafts/owner-a')));
  const publicSnapshot = await assertSucceeds(getDoc(doc(anonymousContext().firestore(), 'profileV2Public/safe-user')));
  assert.equal(publicSnapshot.exists(), false);
});
