import { database, now } from '../../server/visitorStore.js';
import { cleanText, readRawBody, STRIPE_MODE, stripeAccountStatus, verifyStripeSignature } from '../../server/donations.js';

export const config = { api: { bodyParser: false } };

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).send('Method not allowed');
  let event;
  try {
    const rawBody = await readRawBody(request);
    const webhookSecrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(Boolean);
    if (!webhookSecrets.length) throw new Error('Stripe webhooks are not configured.');
    if (!webhookSecrets.some((secret) => verifyStripeSignature(rawBody, request.headers['stripe-signature'], secret))) return response.status(400).send('Invalid signature');
    event = JSON.parse(rawBody.toString('utf8'));
    if (event.livemode !== true) return response.status(400).send('Live Stripe events only');
    const db = database();
    const eventRef = db.collection('stripeEvents').doc(event.id);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await db.runTransaction(async (transaction) => {
        if ((await transaction.get(eventRef)).exists) return;
        const metadata = session.metadata || {};
        if (!metadata.pageUid || !Number.isInteger(Number(session.amount_total))) throw new Error('Checkout metadata is incomplete.');
        transaction.set(db.collection('donations').doc(session.id), {
          pageUid: metadata.pageUid,
          amount: Number(metadata.pledgedAmount) || Number(session.amount_total),
          chargedAmount: Number(session.amount_total),
          fee: Number(metadata.fee) || 0,
          feeCovered: metadata.feeCovered === 'true',
          currency: String(session.currency || 'gbp').toLowerCase(),
          status: 'paid',
          donorName: cleanText(metadata.donorName, 80) || null,
          message: cleanText(metadata.message, 200) || null,
          anonymous: metadata.anonymous === 'true',
          stripeSessionId: session.id,
          createdAt: now(),
        });
        transaction.set(eventRef, { processedAt: now() });
      });
    } else if (event.type === 'account.updated') {
      const account = event.data.object;
      const users = await db.collection('users').where('donations.stripeAccountId', '==', account.id).limit(1).get();
      await db.runTransaction(async (transaction) => {
        if ((await transaction.get(eventRef)).exists) return;
        if (!users.empty) transaction.set(users.docs[0].ref, { donations: { stripeAccountId: account.id, stripeMode: STRIPE_MODE, stripeStatus: stripeAccountStatus(account) } }, { merge: true });
        transaction.set(eventRef, { processedAt: now() });
      });
    } else {
      await db.runTransaction(async (transaction) => {
        if ((await transaction.get(eventRef)).exists) return;
        transaction.set(eventRef, { processedAt: now() });
      });
    }
    return response.status(200).json({ received: true });
  } catch (error) {
    console.error('Donation webhook failed:', event?.id || 'unparsed', error?.message || error);
    return response.status(500).send('Webhook processing failed');
  }
}
