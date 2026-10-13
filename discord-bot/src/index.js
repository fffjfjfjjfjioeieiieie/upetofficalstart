import 'dotenv/config';
import {
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
} from 'discord.js';
import { setupUserPetServer } from './setup-server.js';

if (!process.env.DISCORD_TOKEN) {
  throw new Error('Set DISCORD_TOKEN in discord-bot/.env before starting the bot.');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});
const welcomeBatches = new Map();
const welcomeDelayMs = 8000;

const findTextChannel = (guild, name) => guild.channels.cache.find(
  (channel) => channel.type === ChannelType.GuildText && channel.name === name,
);

const channelReference = (guild, name) => {
  const channel = findTextChannel(guild, name);
  return channel ? `<#${channel.id}>` : `#${name}`;
};

client.once(Events.ClientReady, (readyClient) => {
  console.log(`User.pet bot is online as ${readyClient.user.tag}.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.guild) {
    await interaction.reply({ content: 'Use this command in the User.pet server.', ephemeral: true });
    return;
  }

  if (interaction.commandName === 'about') {
    const about = new EmbedBuilder()
      .setColor(0x8a74ee)
      .setTitle('User.pet is still in development')
      .setDescription('This server is for project progress, ideas, and questions. The website is not live yet; updates will be posted here when that changes.')
      .addFields(
        { name: 'Follow progress', value: `${channelReference(interaction.guild, 'announcements')} · ${channelReference(interaction.guild, 'project-updates')}` },
        { name: 'Share ideas', value: `${channelReference(interaction.guild, 'ideas-and-feedback')} · ${channelReference(interaction.guild, 'showcase')}` },
      )
      .setFooter({ text: 'Early development · details may change' });
    await interaction.reply({ embeds: [about], ephemeral: true, allowedMentions: { parse: [] } });
    return;
  }

  if (interaction.commandName === 'guide') {
    const guide = new EmbedBuilder()
      .setColor(0x8a74ee)
      .setTitle('Server guide')
      .addFields(
        { name: 'Start here', value: `${channelReference(interaction.guild, 'welcome')} · ${channelReference(interaction.guild, 'rules')}` },
        { name: 'Community', value: `${channelReference(interaction.guild, 'general')} · ${channelReference(interaction.guild, 'introductions')} · ${channelReference(interaction.guild, 'ideas-and-feedback')} · ${channelReference(interaction.guild, 'showcase')} · ${channelReference(interaction.guild, 'support')}` },
        { name: 'Project updates', value: `${channelReference(interaction.guild, 'announcements')} · ${channelReference(interaction.guild, 'project-updates')} · ${channelReference(interaction.guild, 'changelog')}` },
      )
      .setFooter({ text: 'The website is still being built.' });
    await interaction.reply({ embeds: [guide], ephemeral: true, allowedMentions: { parse: [] } });
    return;
  }

  if (interaction.commandName !== 'setup') return;

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: 'Only a server administrator can run `/setup`.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  try {
    const result = await setupUserPetServer(interaction.guild);
    await interaction.editReply(
      `Server layout checked: ${result.roles.length} roles and ${result.channels.length} channels. New members receive a quiet welcome with no user or role pings.`,
    );
  } catch (error) {
    console.error('Server setup failed:', error);
    await interaction.editReply(
      'Setup stopped. Check that the bot has Manage Channels, Manage Roles, View Channels, Send Messages, and Embed Links, and that its role is above the roles it manages.',
    );
  }
});

async function sendWelcomeBatch(guild, members) {
  const welcomeName = process.env.WELCOME_CHANNEL_NAME || 'welcome';
  const welcomeChannel = findTextChannel(guild, welcomeName);
  if (!welcomeChannel || members.length === 0) return;

  const welcome = new EmbedBuilder()
    .setColor(0x8a74ee)
    .setTitle(members.length === 1 ? 'Welcome to the User.pet community' : 'New people joined')
    .setDescription('User.pet is still in development, and the website is not live yet. This server is where we share progress, collect ideas, and answer questions while the project takes shape.')
    .addFields(
      { name: 'Start here', value: `${channelReference(guild, 'rules')} · ${channelReference(guild, 'introductions')}` },
      { name: 'Follow progress', value: `${channelReference(guild, 'announcements')} · ${channelReference(guild, 'project-updates')}` },
      { name: 'Share an idea', value: channelReference(guild, 'ideas-and-feedback') },
    )
    .setFooter({ text: `${members.length} new member${members.length === 1 ? '' : 's'} · early development` })
    .setTimestamp();

  try {
    await welcomeChannel.send({
      embeds: [welcome],
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    console.error(`Could not post the welcome batch in ${guild.name}:`, error);
  }
}

client.on(Events.GuildMemberAdd, async (member) => {
  if (member.user.bot) return;

  const newcomerRole = member.guild.roles.cache.find((role) => role.name === 'New Member');
  if (newcomerRole && member.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    try {
      await member.roles.add(newcomerRole, 'Assign the non-mentionable New Member role');
    } catch (error) {
      console.error(`Could not assign New Member to a joiner in ${member.guild.name}:`, error);
    }
  }

  const guildId = member.guild.id;
  const batch = welcomeBatches.get(guildId) ?? { members: [], timer: null };
  batch.members.push(member);
  if (batch.timer) clearTimeout(batch.timer);
  batch.timer = setTimeout(async () => {
    welcomeBatches.delete(guildId);
    await sendWelcomeBatch(member.guild, batch.members);
  }, welcomeDelayMs);
  welcomeBatches.set(guildId, batch);
});

client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

await client.login(process.env.DISCORD_TOKEN);
