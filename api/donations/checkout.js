import { database } from '../../server/visitorStore.js';
import { checkDonationCheckoutBurst, RateLimitError } from '../../server/rateLimit.js';
import { calculatePlatformFee, cleanText, DONATION_MAX_PENCE, DONATION_MIN_PENCE, publicSiteUrl, stripeRequest } from '../../server/donations.js';

const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,19}$/;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    checkDonationCheckoutBurst(request);
    const slug = String(request.body?.pageSlug || '').trim().toLowerCase();
    const amount = Number(request.body?.amount);
    if (!usernamePattern.test(slug) || !Number.isInteger(amount) || amount < DONATION_MIN_PENCE || amount > DONATION_MAX_PENCE) {
      return response.status(400).json({ error: 'Choose an amount between £3 and £5,000.' });
    }
    if (String(request.body?.donorName || '').length > 80 || String(request.body?.message || '').length > 200) {
      return response.status(400).json({ error: 'The name or message is too long.' });
    }
    const donorName = cleanText(request.body?.donorName, 80);
    const message = cleanText(request.body?.message, 200);
    const anonymous = request.body?.anonymous === true;
    const db = database();
    const username = await db.collection('usernames').doc(slug).get();
    if (!username.exists) return response.status(404).json({ error: 'Donation page not found.' });
    const pageUid = username.data().uid;
    const [page, creator] = await Promise.all([
      db.collection('donationPages').doc(pageUid).get(),
      db.collection('users').doc(pageUid).get(),
    ]);
    const account = creator.data()?.donations;
    if (!page.exists || page.data().published !== true || page.data().slug !== slug || account?.stripeStatus !== 'ready' || !account?.stripeAccountId) {
      return response.status(404).json({ error: 'Donation page not found.' });
    }
    const fee = calculatePlatformFee(amount);
    const base = publicSiteUrl();
    const session = await stripeRequest('checkout/sessions', {
      method: 'POST',
      params: {
        mode: 'payment',
        success_url: `${base}/${encodeURIComponent(slug)}/donate?thanks=1`,
        cancel_url: `${base}/${encodeURIComponent(slug)}/donate`,
        line_items: { 0: { price_data: { currency: 'gbp', unit_amount: amount, product_data: { name: `Donation to @${slug}` } }, quantity: 1 } },
        payment_intent_data: { application_fee_amount: fee, transfer_data: { destination: account.stripeAccountId } },
        metadata: { pageUid, donorName, message, anonymous: String(anonymous), fee: String(fee) },
      },
    });
    return response.status(200).json({ url: session.url });
  } catch (error) {
    if (error instanceof RateLimitError) {
      response.setHeader('Retry-After', String(error.retryAfterSeconds));
      return response.status(429).json({ error: 'Too many checkout attempts. Please wait and try again.' });
    }
    console.error('Donation checkout failed:', error?.message || error);
    return response.status(503).json({ error: 'Checkout is temporarily unavailable.' });
  }
}
