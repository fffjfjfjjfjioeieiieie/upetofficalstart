import { limit } from './visitorSecurity.js';

export function notificationBody(visitor) {
  return { content: `**UPET — Page visit**\nPage: \`${visitor.route}\`\nDevice: ${visitor.device}\nTime: ${new Date().toISOString().slice(11, 16)} UTC`, allowed_mentions: { parse: [] } };
}

export async function notifyVisitor(visitor) {
  const webhook = process.env.VISITOR_DISCORD_WEBHOOK_URL;
  const channel = process.env.VISITOR_DISCORD_CHANNEL_ID;
  const token = process.env.DISCORD_TOKEN;
  if (!webhook && !(channel && token)) return;
  try {
    if (!await limit('discord-webhook', 20, 60000)) return;
    const result = await fetch(webhook || `https://discord.com/api/v10/channels/${encodeURIComponent(channel)}/messages`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(!webhook ? { authorization: `Bot ${token}` } : {}) }, signal: AbortSignal.timeout(4000),
      body: JSON.stringify(notificationBody(visitor)),
    });
    if (!result.ok) console.error('Visitor Discord notification failed:', result.status);
  } catch (error) { console.error('Visitor Discord notification failed:', error.message); }
}
