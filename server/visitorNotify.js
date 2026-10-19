import { aggregateSummary } from './visitorAggregate.js';
import { database, expiry, hash, now } from './visitorStore.js';

const site = 'https://www.user.pet';
const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,19}$/;
const safe = (value, length = 100) => String(value ?? 'Unknown').replace(/[\r\n`*_~|<>@]/g, '').slice(0, length);
const avatarUrl = (value) => {
  const src = typeof value === 'string' ? value : value?.src;
  if (!src) return null;
  try {
    const url = new URL(src, site);
    return url.protocol === 'https:' && (src.startsWith('https://') || src.startsWith('/')) ? url.href : null;
  } catch { return null; }
};
const field = (name, value, inline = false) => ({ name, value: safe(value, 1024) || '—', inline });

export async function publicAccount(uid) {
  if (!uid) return { signedIn: false };
  const account = (await database().collection('users').doc(uid).get()).data();
  const username = String(account?.username || '').toLowerCase();
  if (!usernamePattern.test(username)) return { signedIn: true };
  const profile = (await database().collection('directoryProfiles').doc(username).get()).data();
  return {
    signedIn: true, username, url: `${site}/${username}`,
    displayName: profile?.displayName || account?.displayName || username,
    alias: profile?.alias || '', avatar: avatarUrl(profile?.avatar),
  };
}

export function notificationBody(summary, profile = null) {
  const topPages = (summary.pages || []).slice(0, 3).map((page) => `${safe(page.name, 70)} · ${Number(page.value) || 0}`).join(' | ') || 'No pages yet';
  const embed = {
    title: '🐾 user.pet · Visitor pulse', color: 0x8b5cf6,
    description: 'A quiet snapshot of site activity today.', timestamp: new Date().toISOString(),
    fields: [
      field('Visitors today', summary.today?.visits ?? 0, true),
      field('Page views', summary.today?.pageViews ?? 0, true),
      field('Signed-in page views', summary.today?.signedInPageViews ?? 0, true),
      field('Active now', summary.live ?? 0, true),
      field('Top pages', topPages),
      ...(profile?.url ? [{ name: 'Popular public profile', value: `[${safe(profile.username)}](${profile.url})` }] : []),
    ],
    footer: { text: 'Updates at most once every 10 minutes · aggregate statistics' },
    ...(profile?.avatar ? { thumbnail: { url: profile.avatar } } : {}),
  };
  return { embeds: [embed], allowed_mentions: { parse: [] } };
}

export function diagnosticBody(diagnostic, account = { signedIn: false }) {
  const network = diagnostic.network || {};
  const profile = account.url ? `[${safe(account.displayName || account.username)}](${account.url})${account.alias ? ` · ${safe(account.alias)}` : ''}` : 'No public profile';
  const embed = {
    title: '🔎 Your diagnostic test is connected', color: 0x22c55e,
    description: 'Private details from the browser that started and claimed this test.',
    timestamp: diagnostic.enrolledAt?.toDate?.().toISOString() || new Date().toISOString(),
    fields: [
      field('Visitor ID', diagnostic.visitorId),
      field('Public IP', diagnostic.ip, true),
      field('IP version', `IPv${diagnostic.ipVersion}`, true),
      field('Location estimate', [network.city, network.region, network.country].filter(Boolean).join(', ') || 'Unknown'),
      field('ISP / network', [network.isp, network.asn].filter(Boolean).join(' · ') || 'Unknown'),
      field('VPN / proxy / Tor', `${network.vpn ? 'Yes' : 'No'} / ${network.proxy ? 'Yes' : 'No'} / ${network.tor ? 'Yes' : 'No'}`),
      field('Signed in', account.signedIn ? 'Yes, verified' : 'No', true),
      { name: 'Public profile', value: profile, inline: true },
    ],
    footer: { text: 'Explicit 24-hour diagnostic test · network data is approximate' },
    ...(account.avatar ? { thumbnail: { url: account.avatar } } : {}),
  };
  return { embeds: [embed], allowed_mentions: { parse: [] } };
}

async function sendDiscord(payload) {
  const webhook = process.env.VISITOR_DISCORD_WEBHOOK_URL;
  const channel = process.env.VISITOR_DISCORD_CHANNEL_ID;
  const token = process.env.DISCORD_TOKEN;
  if (!webhook && !(channel && token)) return false;
  const result = await fetch(webhook || `https://discord.com/api/v10/channels/${encodeURIComponent(channel)}/messages`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...(!webhook ? { authorization: `Bot ${token}` } : {}) },
    signal: AbortSignal.timeout(5000), body: JSON.stringify(payload),
  });
  if (!result.ok) throw new Error(`Discord returned ${result.status}`);
  return true;
}

export async function notifyVisitor() {
  if (!process.env.VISITOR_DISCORD_WEBHOOK_URL && !(process.env.VISITOR_DISCORD_CHANNEL_ID && process.env.DISCORD_TOKEN)) return;
  try {
    const ref = database().collection('visitorRateLimits').doc(hash('visitor-pulse-throttle'));
    const claimed = await database().runTransaction(async (tx) => {
      const current = (await tx.get(ref)).data();
      if ((current?.nextAt || 0) > Date.now()) return false;
      tx.set(ref, { nextAt: Date.now() + 600000, updatedAt: now(), expiresAt: expiry(86400000) });
      return true;
    });
    if (!claimed) return;
    const summary = await aggregateSummary();
    const top = summary.profiles?.[0]?.name?.slice(1);
    let profile = null;
    if (usernamePattern.test(top || '')) {
      const snapshot = await database().collection('directoryProfiles').doc(top).get();
      const data = snapshot.data();
      if (data) profile = { username: top, displayName: data.displayName, url: `${site}/${top}`, avatar: avatarUrl(data.avatar) };
    }
    await sendDiscord(notificationBody(summary, profile));
  } catch (error) { console.error('Visitor Discord digest failed:', error.message); }
}

export async function notifyDiagnostic(diagnostic, account) {
  try { await sendDiscord(diagnosticBody(diagnostic, account)); }
  catch (error) { console.error('Visitor Discord diagnostic failed:', error.message); }
}
