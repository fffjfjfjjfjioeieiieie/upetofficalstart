import assert from 'node:assert/strict';
import test from 'node:test';
import { createInvitedAccount } from '../server/inviteSignup.js';

function fixtures(invite) {
  const state = { invite: { ...invite }, user: null };
  const inviteRef = { id: 'person@example.com' };
  const db = {
    collection(name) {
      return { doc: () => name === 'accessInvites' ? inviteRef : { set: async (value) => { state.user = value; } } };
    },
    async runTransaction(work) {
      return work({
        get: async () => ({ exists: true, data: () => state.invite }),
        update: (_ref, patch) => { state.invite = { ...state.invite, ...patch }; },
      });
    },
  };
  return { db, state };
}

test('signup consumes an active invite before creating the Auth user', async () => {
  const { db, state } = fixtures({ active: true, role: 'member' });
  const calls = [];
  const auth = {
    createUser: async (input) => { calls.push(input); return { uid: input.uid }; },
    setCustomUserClaims: async (...args) => calls.push(args),
  };
  const result = await createInvitedAccount({ db, auth, email: ' Person@Example.com ', password: 'long-enough-password', uid: 'new-user' });
  assert.equal(result.uid, 'new-user');
  assert.equal(state.invite.active, true);
  assert.equal(state.invite.consumedBy, 'new-user');
  assert.equal(calls[0].email, 'person@example.com');
  assert.deepEqual(calls[1], ['new-user', { member: true }]);
});

test('signup releases the invite and removes a partial Auth user when setup fails', async () => {
  const { db, state } = fixtures({ active: true, role: 'member' });
  let removed = '';
  const auth = {
    createUser: async (input) => ({ uid: input.uid }),
    setCustomUserClaims: async () => { throw new Error('claims failed'); },
    deleteUser: async (uid) => { removed = uid; },
  };
  await assert.rejects(() => createInvitedAccount({ db, auth, email: 'person@example.com', password: 'long-enough-password', uid: 'partial-user' }));
  assert.equal(removed, 'partial-user');
  assert.notEqual(state.invite.consumedBy, 'partial-user');
  assert.equal(state.invite.active, true);
});

test('signup rejects a consumed invite without creating an Auth user', async () => {
  const { db } = fixtures({ active: false, role: 'member', consumedBy: 'existing' });
  let created = false;
  await assert.rejects(() => createInvitedAccount({ db, auth: { createUser: async () => { created = true; } }, email: 'person@example.com', password: 'long-enough-password', uid: 'new-user' }));
  assert.equal(created, false);
});
