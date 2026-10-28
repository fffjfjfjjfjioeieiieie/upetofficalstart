import { AggregateField } from 'firebase-admin/firestore';
import { database } from '../../server/visitorStore.js';
import { cleanText } from '../../server/donations.js';

const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,19}$/;

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=30');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  const slug = String(request.query?.slug || '').trim().toLowerCase();
  if (!usernamePattern.test(slug)) return response.status(404).json({ error: 'Donation page not found.' });
  try {
    const db = database();
    const username = await db.collection('usernames').doc(slug).get();
    if (!username.exists) return response.status(404).json({ error: 'Donation page not found.' });
    const uid = username.data().uid;
    const [page, user] = await Promise.all([
      db.collection('donationPages').doc(uid).get(),
      db.collection('users').doc(uid).get(),
    ]);
    const data = page.data();
    if (!page.exists || data.published !== true || user.data()?.donations?.stripeStatus !== 'ready') return response.status(404).json({ error: 'Donation page not found.' });
    if (request.query?.availability === '1') return response.status(200).json({ available: true });
    const [recent, aggregate] = await Promise.all([
      db.collection('donations').where('pageUid', '==', uid).where('status', '==', 'paid').where('anonymous', '==', false).orderBy('createdAt', 'desc').limit(5).get(),
      db.collection('donations').where('pageUid', '==', uid).where('status', '==', 'paid').aggregate({ total: AggregateField.sum('amount') }).get(),
    ]);
    return response.status(200).json({
      slug,
      title: cleanText(data.title, 100),
      story: cleanText(data.story, 2000),
      goalAmount: Number.isInteger(data.goalAmount) ? data.goalAmount : null,
      totalRaised: Number(aggregate.data().total) || 0,
      recentSupporters: recent.docs.map((document) => ({
        name: cleanText(document.data().donorName, 80) || 'Supporter',
        message: cleanText(document.data().message, 200),
        amount: Number(document.data().amount) || 0,
      })),
    });
  } catch (error) {
    console.error('Public donation page failed:', error?.message || error);
    return response.status(503).json({ error: 'Donation page is temporarily unavailable.' });
  }
}
