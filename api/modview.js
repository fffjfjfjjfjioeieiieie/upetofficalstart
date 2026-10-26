import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { database } from '../server/visitorStore.js';
import { bearerToken, verifyFirebaseIdentity } from '../server/firebaseAuth.js';
import { ACCOUNT_STATUSES, assertBusinessReady, GRANTABLE_BADGES, isFounderIdentity, may, STAFF_DEPARTMENTS, STAFF_ROLES, validUsername } from '../server/modviewPolicy.js';
import { BUSINESS_PROGRAM_ENABLED } from '../src/shared/featureFlags.js';
import { applyProfileGrants } from '../src/redesign/lib/profileGrants.js';

const fail = (res, status, error) => res.status(status).json({ error });
const rows = (snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
const shortText = (value, max = 500) => String(value || '').trim().slice(0, max);
const recent = (db, name, size = 50) => db.collection(name).orderBy('updatedAt', 'desc').limit(size).get().then(rows);
const auditEntry = (actor, action, target, detail = {}) => ({ actorUid: actor.uid, actorEmail: actor.email, action, target, detail, at: Timestamp.now() });

async function accountByQuery(db, query) {
  const key = shortText(query, 254).toLowerCase();
  if (!key) return null;
  if (key.includes('@')) {
    const found = await db.collection('users').where('email', '==', key).limit(1).get();
    return found.docs[0] || null;
  }
  if (!validUsername(key)) return null;
  const profile = await db.collection('profiles').doc(key).get();
  if (!profile.exists || !profile.data().ownerUid) return null;
  return db.collection('users').doc(profile.data().ownerUid).get();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return fail(res, 405, 'Method not allowed.');
  let actor;
  try { actor = await verifyFirebaseIdentity(bearerToken(req)); }
  catch { return fail(res, 401, 'Sign in to access modview.'); }
  try {
    const db = database();
    if (!isFounderIdentity(actor)) {
      const invite = actor.email ? await db.collection('accessInvites').doc(String(actor.email).toLowerCase()).get() : null;
      if (!invite?.exists || invite.data()?.active !== true || invite.data()?.role !== 'member') return fail(res, 403, 'Active Upet member access is required.');
    }
    const member = await db.collection('supportStaff').doc(actor.uid).get();
    const role = member.data()?.active === true && STAFF_ROLES.includes(member.data()?.role) ? member.data().role : '';
    if (!role) return fail(res, 403, 'Staff access required.');
    if (req.method === 'GET') {
      const section = String(req.query?.section || 'overview');
      if (!may(role, section)) return fail(res, 403, 'Your role cannot view this section.');
      if (section === 'overview') {
        const [tickets, businessApps, staffApps] = await Promise.all([recent(db, 'supportTickets', 60), BUSINESS_PROGRAM_ENABLED ? db.collection('businessApplications').where('status', '==', 'pending').limit(60).get().then(rows) : Promise.resolve([]), db.collection('staffApplications').where('status', '==', 'pending').limit(60).get().then(rows)]);
        return res.status(200).json({ role, tickets: tickets.slice(0, 8), counts: { openTickets: tickets.filter((row) => ['open', 'in_progress'].includes(row.status)).length, safetyReports: tickets.filter((row) => row.category === 'Safety/Abuse' && !['resolved', 'closed'].includes(row.status)).length, businessApplications: businessApps.length, peopleApplications: staffApps.length }, limited: tickets.length === 60 || businessApps.length === 60 || staffApps.length === 60 });
      }
      if (section === 'tickets') return res.status(200).json({ items: await recent(db, 'supportTickets') });
      if (section === 'reports') return res.status(200).json({ items: rows(await db.collection('supportTickets').where('category', '==', 'Safety/Abuse').limit(50).get()).sort((a,b) => (b.updatedAt?._seconds || 0) - (a.updatedAt?._seconds || 0)) });
      if (section === 'accounts') {
        const account = await accountByQuery(db, req.query?.q);
        if (!account?.exists) return res.status(200).json({ item: null });
        const data = account.data();
        const restriction = await db.collection('moderationCases').doc(data.username).get();
        return res.status(200).json({ item: { uid: account.id, username: data.username, email: data.email, createdAt: data.createdAt, restriction: restriction.data() || null } });
      }
      if (section === 'businesses') return BUSINESS_PROGRAM_ENABLED ? res.status(200).json({ items: rows(await db.collection('businesses').limit(50).get()) }) : fail(res, 404, 'This section is unavailable.');
      if (section === 'applications') {
        const [business, people] = await Promise.all([BUSINESS_PROGRAM_ENABLED ? db.collection('businessApplications').limit(50).get() : Promise.resolve(null), db.collection('staffApplications').limit(50).get()]);
        return res.status(200).json({ business: business ? rows(business) : [], people: rows(people) });
      }
      if (section === 'badges') {
        const search = shortText(req.query?.q, 254).toLowerCase();
        let username = '';
        let ownerUid = '';
        let email = '';
        if (search.includes('@')) {
          const account = await accountByQuery(db, search);
          if (account?.exists) {
            username = String(account.data()?.username || '').trim().toLowerCase();
            ownerUid = account.id;
            email = String(account.data()?.email || search);
          }
        } else if (validUsername(search)) {
          username = search;
        }
        if (!validUsername(username)) return res.status(200).json({ item: null });
        const [profile, grants] = await Promise.all([db.collection('profiles').doc(username).get(), db.collection('profileBadgeGrants').doc(username).get()]);
        if (profile.exists && !ownerUid) ownerUid = profile.data().ownerUid || profile.data().uid || '';
        if (profile.exists && !email && ownerUid) {
          const account = await db.collection('users').doc(ownerUid).get();
          email = account.data()?.email || '';
        }
        return res.status(200).json({ item: profile.exists ? { username, ownerUid, email, badges: grants.data()?.badges || [] } : null });
      }
      if (section === 'team') {
        const staffRows = rows(await db.collection('supportStaff').limit(50).get());
        const items = await Promise.all(staffRows.map(async (entry) => {
          if (entry.username && entry.email) return entry;
          const account = await db.collection('users').doc(entry.id).get();
          return { ...entry, username: entry.username || account.data()?.username || '', email: entry.email || account.data()?.email || '' };
        }));
        return res.status(200).json({ items });
      }
      if (section === 'audit') return res.status(200).json({ items: rows(await db.collection('moderationAudit').orderBy('at', 'desc').limit(40).get()) });
      if (section === 'access') {
        if (role !== 'owner') return fail(res, 403, 'Only founders can manage member access.');
        const invites = rows(await db.collection('accessInvites').orderBy('updatedAt', 'desc').limit(100).get());
        return res.status(200).json({ items: invites.map(({ email, active, role: memberRole, updatedAt, grantedBy }) => ({ email, active, role: memberRole, updatedAt, grantedBy })) });
      }
      return fail(res, 400, 'Unknown section.');
    }
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const action = String(body.action || '');
    if (!may(role, action)) return fail(res, 403, 'Your role cannot perform this action.');
    if (action === 'businessDecision' && !BUSINESS_PROGRAM_ENABLED) return fail(res, 410, 'The business programme is currently unavailable.');
    if (action === 'accessSet') {
      if (role !== 'owner') return fail(res, 403, 'Only founders can manage member access.');
      const email = shortText(body.email, 254).toLowerCase();
      const active = body.active === true;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'Enter a valid email address.');
      if (email === String(actor.email || '').toLowerCase() && !active) return fail(res, 400, 'You cannot revoke your own member invitation.');
      const ref = db.collection('accessInvites').doc(email);
      const previous = await ref.get();
      const batch = db.batch();
      batch.set(ref, { email, role: 'member', active, grantedBy: actor.uid, updatedAt: FieldValue.serverTimestamp(), createdAt: previous.data()?.createdAt || FieldValue.serverTimestamp() }, { merge: true });
      batch.create(db.collection('moderationAudit').doc(), auditEntry(actor, active ? 'member_access_granted' : 'member_access_revoked', email));
      await batch.commit();
      return res.status(200).json({ ok: true });
    }
    if (action === 'businessDecision') {
      const uid = shortText(body.uid, 128);
      if (!uid || !['approve', 'reject'].includes(body.decision)) return fail(res, 400, 'Choose an application and decision.');
      if (body.decision === 'reject' && shortText(body.note).length < 10) return fail(res, 400, 'Explain the rejection in at least 10 characters.');
      const ref = db.collection('businessApplications').doc(uid);
      await db.runTransaction(async (tx) => {
        const app = await tx.get(ref);
        if (!app.exists || app.data().status !== 'pending') throw new Error('Pending application not found.');
        const row = app.data();
        const profile = await tx.get(db.collection('profiles').doc(row.username));
        if (body.decision === 'approve') assertBusinessReady(row, row.username, profile.data());
        tx.update(ref, { status: body.decision === 'approve' ? 'approved' : 'rejected', reviewNote: shortText(body.note), reviewedBy: actor.uid, reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        if (body.decision === 'approve') tx.set(db.collection('verifiedBusinesses').doc(row.username), { username: row.username, ownerUid: uid, businessName: row.businessName, category: row.category, status: 'approved', verifiedAt: FieldValue.serverTimestamp() });
        tx.create(db.collection('moderationAudit').doc(), auditEntry(actor, `business_${body.decision}`, uid, { note: shortText(body.note) }));
      });
      return res.status(200).json({ ok: true });
    }
    if (action === 'staffDecision') {
      const uid = shortText(body.uid, 128);
      if (!uid || !['approve', 'reject'].includes(body.decision)) return fail(res, 400, 'Choose an application and decision.');
      if (body.decision === 'reject' && shortText(body.note).length < 10) return fail(res, 400, 'Explain the rejection in at least 10 characters.');
      const ref = db.collection('staffApplications').doc(uid);
      await db.runTransaction(async (tx) => {
        const app = await tx.get(ref);
        if (!app.exists || app.data().status !== 'pending') throw new Error('Pending application not found.');
        tx.update(ref, { status: body.decision === 'approve' ? 'approved' : 'rejected', reviewNote: shortText(body.note), reviewedBy: actor.uid, reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        tx.create(db.collection('moderationAudit').doc(), auditEntry(actor, `staff_application_${body.decision}`, uid, { note: shortText(body.note) }));
      });
      return res.status(200).json({ ok: true });
    }
    if (action === 'staffSave') {
      const username = shortText(body.username, 20).toLowerCase();
      const email = shortText(body.email, 254).toLowerCase();
      const target = await accountByQuery(db, username || email);
      if (!target?.exists || (username && target.data().username !== username) || (email && target.data().email !== email)) return fail(res, 404, 'A matching personal account is required.');
      if (target.id === actor.uid) return fail(res, 400, 'You cannot change your own staff access.');
      const newRole = String(body.role || '');
      const department = String(body.department || '');
      if (!STAFF_ROLES.includes(newRole) || !STAFF_DEPARTMENTS.includes(department)) return fail(res, 400, 'Choose a valid role and department.');
      if (newRole === 'owner' && role !== 'owner') return fail(res, 403, 'Only owners may assign owners.');
      const active = body.active === true;
      const ref = db.collection('supportStaff').doc(target.id);
      await db.runTransaction(async (tx) => {
        const current = await tx.get(ref);
        if (current.data()?.role === 'owner' && current.data()?.active && (newRole !== 'owner' || !active)) {
          const owners = await tx.get(db.collection('supportStaff').where('role', '==', 'owner').where('active', '==', true).limit(2));
          if (owners.size < 2) throw new Error('The last active owner cannot be removed.');
        }
        tx.set(ref, { uid: target.id, email: target.data().email, username: target.data().username, role: newRole, department, jobTitle: shortText(body.jobTitle, 80), active, capabilities: [], createdAt: current.data()?.createdAt || FieldValue.serverTimestamp(), addedBy: current.data()?.addedBy || actor.uid, updatedAt: FieldValue.serverTimestamp() });
        tx.create(db.collection('moderationAudit').doc(), auditEntry(actor, 'staff_saved', target.id, { role: newRole, department, active }));
      });
      return res.status(200).json({ ok: true });
    }
    if (action === 'badgeSet') {
      let username = String(body.username || '').trim().toLowerCase();
      if (!username && body.email) {
        const account = await accountByQuery(db, body.email);
        username = String(account?.data()?.username || '').trim().toLowerCase();
      }
      const badges = [...new Set(Array.isArray(body.badges) ? body.badges : [])];
      if (!validUsername(username) || badges.some((badge) => !GRANTABLE_BADGES.includes(badge))) return fail(res, 400, 'Choose a valid profile and badges.');
      const profile = await db.collection('profiles').doc(username).get();
      if (!profile.exists) return fail(res, 404, 'Profile not found.');
      const batch = db.batch();
      batch.set(db.collection('profileBadgeGrants').doc(username), { username, badges, updatedAt: FieldValue.serverTimestamp() });
      const directory = await db.collection('directoryProfiles').doc(username).get();
      if (directory.exists) batch.update(directory.ref, { badges });
      batch.create(db.collection('moderationAudit').doc(), auditEntry(actor, 'badges_updated', username, { badges }));
      await batch.commit();
      return res.status(200).json({ ok: true });
    }
    if (action === 'accountSet') {
      const username = String(body.username || '').trim().toLowerCase();
      const status = String(body.status || '');
      const reason = shortText(body.reason, 500);
      if (!validUsername(username) || !ACCOUNT_STATUSES.includes(status) || (status === 'restricted' && reason.length < 10)) return fail(res, 400, 'Choose a valid status and give a reason of at least 10 characters.');
      const profileRef = db.collection('profiles').doc(username);
      const profile = await profileRef.get();
      if (!profile.exists) return fail(res, 404, 'Profile not found.');
      const targetUid = profile.data().ownerUid;
      if (targetUid === actor.uid) return fail(res, 400, 'You cannot restrict your own profile.');
      const targetStaff = await db.collection('supportStaff').doc(targetUid).get();
      if (targetStaff.data()?.role === 'owner') return fail(res, 403, 'Owner profiles cannot be restricted here.');
      if (targetStaff.data()?.active && role !== 'owner') return fail(res, 403, 'Only an owner can restrict a staff profile.');
      const ref = db.collection('moderationProfiles').doc(username);
      const caseRef = db.collection('moderationCases').doc(username);
      const directoryRef = db.collection('directoryProfiles').doc(username);
      const badgeGrants = await db.collection('profileBadgeGrants').doc(username).get();
      const batch = db.batch();
      batch.set(ref, { username, status, updatedAt: FieldValue.serverTimestamp() });
      batch.set(caseRef, { username, status, reason, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
      if (status === 'restricted') batch.delete(directoryRef);
      else { const published = profile.data().published?.redesign; if (published) batch.set(directoryRef, { ownerUid: targetUid, username, displayName: published.displayName || username, alias: published.alias || username, avatar: published.media?.avatar || {}, badges: applyProfileGrants(published, badgeGrants.data()?.badges).shownBadges, shop: published.shop || {}, updatedAt: FieldValue.serverTimestamp() }); }
      batch.create(db.collection('moderationAudit').doc(), auditEntry(actor, `account_${status}`, username, { reason }));
      await batch.commit();
      return res.status(200).json({ ok: true });
    }
    return fail(res, 400, 'Unknown action.');
  } catch (error) {
    console.error('Modview request failed:', error);
    return fail(res, 400, error.message || 'Modview request failed.');
  }
}
