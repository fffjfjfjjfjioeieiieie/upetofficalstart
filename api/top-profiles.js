import { topProfiles } from '../server/topProfiles.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const profiles = await topProfiles();
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=60');
    return res.status(200).json({ profiles });
  } catch (error) {
    console.error('Top profiles request failed:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Top profiles are temporarily unavailable.' });
  }
}
