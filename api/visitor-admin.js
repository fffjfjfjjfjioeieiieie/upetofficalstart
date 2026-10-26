export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ error: 'The visitor Discord integration and individual visitor lookup have been removed.' });
}
