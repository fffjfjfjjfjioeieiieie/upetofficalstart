import 'dotenv/config';
import { Client, EmbedBuilder, Events, GatewayIntentBits, MessageFlags } from 'discord.js';

const { DISCORD_TOKEN, DISCORD_GUILD_ID, DISCORD_ADMIN_IDS, VISITOR_API_URL, VISITOR_BOT_SECRET } = process.env;
if (!DISCORD_TOKEN || !DISCORD_GUILD_ID || !DISCORD_ADMIN_IDS || !VISITOR_API_URL || !VISITOR_BOT_SECRET) throw new Error('Configure the Discord visitor bot environment before starting.');
const admins = new Set(DISCORD_ADMIN_IDS.split(',').map((v) => v.trim()).filter(Boolean));
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const safe = (value) => String(value ?? 'Unknown').replace(/[`*_~>|@]/g, '').slice(0, 200);
const line = (label, value) => `**${label}:** ${safe(value)}`;

async function query(command, visitorId, actor) {
  const response = await fetch(new URL('/api/visitor-admin', VISITOR_API_URL), {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-visitor-bot-secret': VISITOR_BOT_SECRET, 'x-discord-admin-id': actor },
    body: JSON.stringify({ command, id: visitorId }), signal: AbortSignal.timeout(8000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Visitor API is unavailable.');
  return data;
}

function format(command, data) {
  if (data.message) return data.message;
  if (command === 'recent') return data.recent.length ? data.recent.map((v) => `${safe(v.id)} · ${safe(v.lastAt)} · ${safe(v.route)}`).join('\n') : 'No recent diagnostic tests.';
  if (command === 'live') return `Active visitors: ${data.live}`;
  if (command === 'today') return Object.entries(data.today).map(([k, v]) => line(k, v)).join('\n');
  if (command === 'countries') return data.countries.length ? data.countries.map((v) => `${safe(v.name)}: ${v.value}`).join('\n') : 'No country data.';
  if (command === 'security') return [line('Bot visits', data.security.bots), line('Security events', data.security.events)].join('\n');
  if (command === 'myip') return [line('Visitor ID', data.id), line('Public IP', data.ip), line('Version', `IPv${data.ipVersion}`)].join('\n');
  if (command === 'history') return data.visitor.events.length ? data.visitor.events.map((e) => `${safe(e.at)} · ${safe(e.type)} · ${safe(e.route)} ${safe(e.detail || '')}`).join('\n') : 'No events recorded.';
  if (command === 'network') return Object.entries(data.diagnostic || {}).map(([k, v]) => line(k, v)).join('\n');
  const v = data.visitor;
  const d = data.diagnostic;
  return [line('Visitor ID', v.id), line('First visit', v.firstAt), line('Last visit', v.lastAt), line('Pages', v.pageViews), line('Duration (seconds)', v.durationSeconds), line('Country', v.country), line('Device', v.device), line('Browser', v.browser), line('OS', v.os), ...(d ? [line('Public IP', d.ip), line('IP version', `IPv${d.ipVersion}`), line('City', d.city), line('Region', d.region), line('IP country', d.country), line('ISP', d.isp), line('ASN', d.asn), line('Network', d.network), line('VPN', d.vpn), line('Proxy', d.proxy), line('Tor', d.tor), line('Timezone', d.timezone), line('Language', d.language), line('Screen', d.screen), line('Viewport', d.viewport)] : [])].join('\n');
}

function diagnosticEmbed(data) {
  const d = data.diagnostic;
  if (!d) return null;
  const v = data.visitor;
  const a = data.account;
  const location = [d.city, d.region, d.country].filter(Boolean).map(safe).join(', ') || 'Unknown';
  const profile = a?.url ? `[${safe(a.displayName || a.username)}](${a.url})` : 'No public profile';
  const embed = new EmbedBuilder()
    .setTitle('🔎 Visitor diagnostic')
    .setColor(0x22c55e)
    .setDescription(`Private details for verified test \`${safe(v.id)}\``)
    .addFields(
      { name: 'Public IP', value: safe(d.ip), inline: true },
      { name: 'Account signed in', value: a?.signedIn ? 'Yes' : 'No', inline: true },
      { name: 'Public profile', value: profile },
      { name: 'Location estimate', value: location },
      { name: 'ISP / ASN', value: [d.isp, d.asn].filter(Boolean).map(safe).join(' · ') || 'Unknown' },
      { name: 'VPN / Proxy / Tor', value: `${d.vpn ? 'Yes' : 'No'} / ${d.proxy ? 'Yes' : 'No'} / ${d.tor ? 'Yes' : 'No'}` },
      { name: 'Pages / last route', value: `${v.pageViews || 0} · ${safe(v.route)}` },
    )
    .setFooter({ text: 'Explicit 24-hour diagnostic test · estimates may be inaccurate' });
  if (a?.avatar) embed.setThumbnail(a.avatar);
  return embed;
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || !['visitor', 'analytics'].includes(interaction.commandName)) return;
  if (interaction.guildId !== DISCORD_GUILD_ID || !admins.has(interaction.user.id)) {
    await interaction.reply({ content: 'You are not authorised to use this command.', flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const command = interaction.options.getSubcommand();
    const visitorId = interaction.options.getString('id') || '';
    const result = await query(command, visitorId, interaction.user.id);
    const embed = command === 'info' ? diagnosticEmbed(result) : null;
    await interaction.editReply(embed
      ? { embeds: [embed], allowedMentions: { parse: [] } }
      : { content: format(command, result).slice(0, 1900) || 'No data.', allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('Visitor command failed:', error);
    await interaction.editReply('Visitor lookup failed. Check the API connection and try again.');
  }
});

client.once(Events.ClientReady, (ready) => console.log(`Visitor bot online as ${ready.user.tag}`));
await client.login(DISCORD_TOKEN);
