import 'dotenv/config';
import { REST, Routes, PermissionFlagsBits } from 'discord.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  throw new Error('Set DISCORD_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID in discord-bot/.env first.');
}

const commands = [
  {
    name: 'about',
    description: 'See what User.pet is and what is happening with the project.',
  },
  {
    name: 'guide',
    description: 'Get a quick guide to the User.pet Discord server.',
  },
  {
    name: 'setup',
    description: 'Create or update the User.pet server layout, roles, and channels.',
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
  },
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

await rest.put(
  Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
  { body: commands },
);

console.log('Registered /about, /guide, and /setup for the configured server.');
