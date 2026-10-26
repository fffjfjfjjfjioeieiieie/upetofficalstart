import { discordRedirectUri, requestOrigin, verifyDiscordState } from '../server/discordOAuth.js';
import { discordPublicProfile } from '../src/shared/discordProfile.js';

export const discordCallbackPage = (origin, message) => {
  const data = JSON.stringify(message).replace(/</g, '\\u003c');
  const target = JSON.stringify(origin);
  const fallback = JSON.stringify(`${origin}/dashboard/settings#discord-result=${encodeURIComponent(JSON.stringify(message))}`);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Discord connected</title></head><body style="margin:0;background:#090b10;color:#fff;font:15px system-ui;display:grid;min-height:100vh;place-items:center"><p>Returning to user.pet…</p><script>if(window.opener&&!window.opener.closed){window.opener.postMessage(${data},${target});window.close()}else{location.replace(${fallback})}</script></body></html>`;
};

export default async function handler(request, response) {
  let origin = requestOrigin(request);
  try {
    if (request.method !== 'GET') throw new Error('Method not allowed.');
    if (request.query?.error) throw new Error('Discord authorization was cancelled.');
    const state = verifyDiscordState(request.query?.state);
    origin = state.returnOrigin || origin;
    const code = String(request.query?.code || '');
    if (!code) throw new Error('Discord did not return an authorization code.');
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code,
        redirect_uri: discordRedirectUri(request),
      }),
    });
    const token = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !token.access_token) throw new Error('Discord authorization expired or could not be completed. Please reconnect.');
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', { headers: { Authorization: `Bearer ${token.access_token}` } });
    const discord = await userResponse.json().catch(() => ({}));
    if (!userResponse.ok || !discord.id) throw new Error('Discord account details could not be loaded. Please reconnect.');
    const connection = discordPublicProfile(discord);
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).send(discordCallbackPage(origin, { type: 'upet-discord-connected', uid: state.uid, connection }));
  } catch (error) {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    return response.status(400).send(discordCallbackPage(origin, { type: 'upet-discord-error', error: error instanceof Error ? error.message : 'Discord connection failed.' }));
  }
}
