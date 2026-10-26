import { database } from '../server/visitorStore.js';

const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,19}$/;

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=60');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  const username = String(request.query?.username || '').trim().toLowerCase();
  if (!usernamePattern.test(username)) return response.status(400).json({ error: 'Invalid username.' });
  try {
    const db = database();
    const [profile, aggregate] = await Promise.all([
      db.collection('profiles').doc(username).get(),
      db.collection('profileRankingStats').doc(username).get(),
    ]);
    if (!profile.exists || (profile.data().status !== 'published' && !profile.data().published)) return response.status(404).json({ error: 'Profile not found.' });
    return response.status(200).json({ username, views: Number(aggregate.data()?.views) || 0 });
  } catch (error) {
    console.error('Profile view count failed:', error);
    return response.status(503).json({ error: 'View count is temporarily unavailable.' });
  }
}
