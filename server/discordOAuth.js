import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const encode = (value) => Buffer.from(value).toString('base64url');
const decode = (value) => Buffer.from(value, 'base64url').toString('utf8');

function secret() {
  const value = process.env.DISCORD_CLIENT_SECRET;
  if (!value) throw new Error('Discord connection is not configured.');
  return value;
}

export function requestOrigin(request) {
  const protocol = String(request.headers?.['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(request.headers?.['x-forwarded-host'] || request.headers?.host || 'www.user.pet').split(',')[0].trim();
  const origin = `${protocol}://${host}`;
  try {
    const parsed = new URL(origin);
    const allowed = parsed.hostname === 'user.pet'
      || parsed.hostname === 'www.user.pet'
      || parsed.hostname.endsWith('.vercel.app')
      || (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
    return allowed ? parsed.origin : 'https://www.user.pet';
  } catch {
    return 'https://www.user.pet';
  }
}

export function discordRedirectUri() {
  return process.env.DISCORD_REDIRECT_URI || 'https://www.user.pet/api/discord-callback';
}

export function createDiscordState(uid, returnOrigin = 'https://www.user.pet') {
  const payload = encode(JSON.stringify({ uid, returnOrigin, nonce: randomBytes(18).toString('hex'), expires: Date.now() + 10 * 60_000 }));
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyDiscordState(state) {
  const [payload, signature] = String(state || '').split('.');
  if (!payload || !signature) throw new Error('The Discord connection request is invalid.');
  const expected = createHmac('sha256', secret()).update(payload).digest();
  const received = Buffer.from(signature, 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error('The Discord connection request is invalid.');
  const parsed = JSON.parse(decode(payload));
  if (!parsed.uid || Number(parsed.expires) < Date.now()) throw new Error('The Discord connection request expired.');
  return parsed;
}
