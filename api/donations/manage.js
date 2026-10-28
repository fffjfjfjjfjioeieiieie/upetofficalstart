import { AggregateField } from 'firebase-admin/firestore';
import { bearerToken, verifyFirebaseIdentity } from '../../server/firebaseAuth.js';
import { database, now } from '../../server/visitorStore.js';
import { cleanText, STRIPE_MODE, stripeAccountStatus, stripeRequest } from '../../server/donations.js';

const donationJson = (document) => {
  const value = document.data();
  return {
    id: document.id,
    amount: Number(value.amount) || 0,
    donorName: value.anonymous ? '' : cleanText(value.donorName, 80),
    message: cleanText(value.message, 200),
    anonymous: value.anonymous === true,
    createdAt: value.createdAt?.toMillis?.() || null,
  };
};

export default async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const identity = await verifyFirebaseIdentity(bearerToken(request));
    const db = database();
    const userRef = db.collection('users').doc(identity.uid);
    const pageRef = db.collection('donationPages').doc(identity.uid);
    const user = await userRef.get();
    if (!user.exists || !user.data().username) return response.status(409).json({ error: 'Claim a username first.' });
    const username = String(user.data().username).toLowerCase();
    const storedDonations = user.data().donations || {};
    const hasLiveAccount = storedDonations.stripeMode === STRIPE_MODE && Boolean(storedDonations.stripeAccountId);
    let stripeStatus = hasLiveAccount ? 'pending' : 'none';
    if (hasLiveAccount) {
      const account = await stripeRequest(`accounts/${encodeURIComponent(storedDonations.stripeAccountId)}`);
      stripeStatus = stripeAccountStatus(account);
      if (stripeStatus !== storedDonations.stripeStatus) {
        await userRef.set({ donations: { stripeAccountId: storedDonations.stripeAccountId, stripeMode: STRIPE_MODE, stripeStatus } }, { merge: true });
      }
    }

    if (request.method === 'POST') {
      const current = await pageRef.get();
      const title = cleanText(request.body?.title, 100);
      const story = cleanText(request.body?.story, 2000);
      const published = request.body?.published === true;
      const goal = request.body?.goalAmount;
      const goalAmount = goal === '' || goal === null || goal === undefined ? null : Number(goal);
      if (!title) return response.status(400).json({ error: 'Add a page title.' });
      if (story.length > 2000 || (goalAmount !== null && (!Number.isInteger(goalAmount) || goalAmount < 100))) return response.status(400).json({ error: 'Enter valid page settings.' });
      if (published && stripeStatus !== 'ready') return response.status(409).json({ error: 'Finish Stripe onboarding before publishing.' });
      const timestamp = now();
      const page = { slug: username, title, story, published, updatedAt: timestamp, createdAt: current.data()?.createdAt || timestamp };
      if (goalAmount !== null) page.goalAmount = goalAmount;
      await pageRef.set(page);
    }

    const [page, recent, aggregate] = await Promise.all([
      pageRef.get(),
      db.collection('donations').where('pageUid', '==', identity.uid).where('status', '==', 'paid').orderBy('createdAt', 'desc').limit(10).get(),
      db.collection('donations').where('pageUid', '==', identity.uid).where('status', '==', 'paid').aggregate({ total: AggregateField.sum('amount'), fees: AggregateField.sum('fee'), count: AggregateField.count() }).get(),
    ]);
    const data = page.data() || {};
    return response.status(200).json({
      stripeStatus,
      page: { slug: username, title: data.title || '', story: data.story || '', goalAmount: Number.isInteger(data.goalAmount) ? data.goalAmount : null, published: data.published === true },
      totalRaised: Number(aggregate.data().total) || 0,
      estimatedFees: Number(aggregate.data().fees) || 0,
      donationCount: Number(aggregate.data().count) || 0,
      charityApproved: storedDonations.charityApproved === true,
      donations: recent.docs.map(donationJson),
    });
  } catch (error) {
    console.error('Donation dashboard failed:', error?.message || error);
    const authFailure = /token|sign in|JWT|credential/i.test(error?.message || '');
    return response.status(authFailure ? 401 : 503).json({ error: authFailure ? 'Sign in again.' : 'Donation settings are temporarily unavailable.' });
  }
}
