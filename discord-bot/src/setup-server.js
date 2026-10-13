import {
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';

const roleDefinitions = [
  {
    name: 'Admin',
    color: 0x5865f2,
    permissions: [PermissionFlagsBits.Administrator],
    hoist: true,
  },
  {
    name: 'Moderator',
    color: 0xed4245,
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.KickMembers,
    ],
    hoist: true,
  },
  {
    name: 'Artist',
    color: 0xeb459e,
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.SendMessagesInThreads,
    ],
    hoist: true,
  },
  {
    name: 'Member',
    color: 0x57f287,
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.SendMessagesInThreads,
    ],
    hoist: false,
  },
  {
    name: 'New Member',
    color: 0x99aab5,
    permissions: [],
    hoist: false,
  },
];

const channelGroups = [
  {
    name: 'START HERE',
    access: 'readOnly',
    channels: [
      ['welcome', 'User.pet is in development and the website is not live yet. Start here for project context.'],
      ['rules', 'Community guidelines and server info.'],
    ],
  },
  {
    name: 'COMMUNITY',
    access: 'community',
    channels: [
      ['general', 'Chat about User.pet and anything else.'],
      ['introductions', 'Introduce yourself to the community.'],
      ['ideas-and-feedback', 'Share ideas and feedback while User.pet is in development.'],
      ['showcase', 'Share profile concepts, art, mockups, and work in progress.'],
      ['support', 'Ask questions about the project while the website is in development.'],
    ],
  },
  {
    name: 'PROJECT UPDATES',
    access: 'readOnly',
    channels: [
      ['announcements', 'Important User.pet project news. The website is not live yet.'],
      ['project-updates', 'Development progress and upcoming work.'],
      ['changelog', 'Website changes as development progresses.'],
    ],
  },
  {
    name: 'VOICE',
    access: 'voice',
    channels: [
      ['Community Lounge', ChannelType.GuildVoice],
    ],
  },
  {
    name: 'STAFF',
    access: 'staff',
    channels: [
      ['staff-chat', 'Private staff coordination.'],
      ['mod-logs', 'Private notes for moderation.'],
    ],
  },
];

function createOverwrites(guild, roles, access) {
  const everyoneId = guild.roles.everyone.id;
  const admin = roles.get('Admin');
  const moderator = roles.get('Moderator');
  const base = (allow, deny = []) => ({
    id: everyoneId,
    allow,
    deny,
  });

  if (access === 'readOnly') {
    return [
      base(
        [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
      ),
      {
        id: moderator.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ];
  }

  if (access === 'community') {
    return [base([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.SendMessages,
    ])];
  }

  if (access === 'voice') {
    return [base([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
    ])];
  }

  if (access === 'staff') {
    return [
      {
        id: everyoneId,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: admin.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.SendMessages,
        ],
      },
      {
        id: moderator.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.SendMessages,
        ],
      },
    ];
  }

  return [];
}

async function getOrCreateRole(guild, definition) {
  const existing = guild.roles.cache.find((role) => role.name === definition.name);
  if (existing) {
    return guild.roles.edit(existing.id, {
      color: definition.color,
      permissions: definition.permissions,
      hoist: definition.hoist,
      mentionable: false,
      reason: 'User.pet server setup',
    });
  }

  return guild.roles.create({
    name: definition.name,
    color: definition.color,
    permissions: definition.permissions,
    hoist: definition.hoist,
    mentionable: false,
    reason: 'User.pet server setup',
  });
}

async function getOrCreateCategory(guild, name, permissionOverwrites) {
  const existing = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildCategory && channel.name === name,
  );
  const category = existing ?? await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites,
    reason: 'User.pet server setup',
  });

  if (existing) {
    await category.permissionOverwrites.set(permissionOverwrites);
  }
  return category;
}

async function getOrCreateChannel(guild, category, channelSpec, permissionOverwrites) {
  const [name, descriptionOrType] = channelSpec;
  const type = typeof descriptionOrType === 'number' ? descriptionOrType : ChannelType.GuildText;
  const topic = type === ChannelType.GuildText ? descriptionOrType : undefined;
  const existing = guild.channels.cache.find(
    (channel) => channel.type === type && channel.name === name,
  );
  const channel = existing ?? await guild.channels.create({
    name,
    type,
    parent: category.id,
    topic,
    permissionOverwrites,
    reason: 'User.pet server setup',
  });

  if (existing) {
    if (channel.parentId !== category.id) {
      await channel.setParent(category.id, { lockPermissions: false });
    }
    if (topic && channel.setTopic) await channel.setTopic(topic);
    await channel.permissionOverwrites.set(permissionOverwrites);
  }

  return channel;
}

export async function setupUserPetServer(guild) {
  const roles = new Map();
  for (const definition of roleDefinitions) {
    roles.set(definition.name, await getOrCreateRole(guild, definition));
  }

  const createdChannels = [];
  for (const group of channelGroups) {
    const categoryOverwrites = createOverwrites(guild, roles, group.access);
    const category = await getOrCreateCategory(guild, group.name, categoryOverwrites);

    for (const channelSpec of group.channels) {
      const configuredChannelSpec = group.name === 'START HERE' && channelSpec[0] === 'welcome'
        ? [process.env.WELCOME_CHANNEL_NAME || 'welcome', channelSpec[1]]
        : channelSpec;
      const overwrites = [...categoryOverwrites];
      if (group.access === 'readOnly' && configuredChannelSpec[0] === (process.env.WELCOME_CHANNEL_NAME || 'welcome')) {
        const botId = guild.members.me?.id;
        if (botId) {
          overwrites.push({
            id: botId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
            ],
          });
        }
      }
      const channel = await getOrCreateChannel(guild, category, configuredChannelSpec, overwrites);
      createdChannels.push(channel.name);
    }
  }

  return {
    roles: roleDefinitions.map(({ name }) => name),
    channels: createdChannels,
  };
}
