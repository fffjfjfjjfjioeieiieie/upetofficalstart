import { bearerToken, verifyFirebaseIdentity } from '../../server/firebaseAuth.js';
import { database } from '../../server/visitorStore.js';
import { publicSiteUrl, STRIPE_MODE, stripeAccountStatus, stripeRequest } from '../../server/donations.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const identity = await verifyFirebaseIdentity(bearerToken(request));
    const db = database();
    const userRef = db.collection('users').doc(identity.uid);
    const user = await userRef.get();
    if (!user.exists || !user.data().username) return response.status(409).json({ error: 'Claim a username first.' });
    const storedDonations = user.data().donations || {};
    let accountId = storedDonations.stripeMode === STRIPE_MODE ? storedDonations.stripeAccountId : null;
    let account;
    if (accountId) account = await stripeRequest(`accounts/${encodeURIComponent(accountId)}`);
    else {
      account = await stripeRequest('accounts', {
        method: 'POST',
        idempotencyKey: `donations-connect-${identity.uid}`,
        params: { type: 'express', country: 'GB', capabilities: { card_payments: { requested: true }, transfers: { requested: true } }, metadata: { user_pet_uid: identity.uid } },
      });
      accountId = account.id;
    }
    await userRef.set({ donations: { stripeAccountId: accountId, stripeMode: STRIPE_MODE, stripeStatus: stripeAccountStatus(account) } }, { merge: true });
    const base = publicSiteUrl();
    const link = await stripeRequest('account_links', {
      method: 'POST',
      params: {
        account: accountId,
        type: 'account_onboarding',
        refresh_url: `${base}/dashboard/donations?stripe=refresh`,
        return_url: `${base}/dashboard/donations?stripe=return`,
      },
    });
    return response.status(200).json({ url: link.url });
  } catch (error) {
    console.error('Donation Connect failed:', error?.message || error);
    const authFailure = /token|sign in|JWT|credential/i.test(error?.message || '');
    return response.status(authFailure ? 401 : 503).json({ error: authFailure ? 'Sign in again.' : 'Stripe onboarding is temporarily unavailable.' });
  }
}
