import { bearerToken, verifyFirebaseIdentity } from '../server/firebaseAuth.js';
import { createDiscordState, discordRedirectUri, requestOrigin } from '../server/discordOAuth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  try {
    const identity = await verifyFirebaseIdentity(bearerToken(request));
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId || !process.env.DISCORD_CLIENT_SECRET) throw new Error('Discord connection is not configured.');
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: discordRedirectUri(request),
      scope: 'identify',
      state: createDiscordState(identity.uid, requestOrigin(request)),
      prompt: 'consent',
    });
    return response.status(200).json({ url: `https://discord.com/oauth2/authorize?${params}` });
  } catch (error) {
    return response.status(400).json({ error: error instanceof Error ? error.message : 'Discord connection could not start.' });
  }
}
