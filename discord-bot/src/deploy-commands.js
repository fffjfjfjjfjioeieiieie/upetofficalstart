import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) throw new Error('Configure DISCORD_TOKEN, DISCORD_CLIENT_ID and DISCORD_GUILD_ID first.');
try {
  await new REST({ version: '10' }).setToken(DISCORD_TOKEN).put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), { body: commands });
  console.log('Registered /visitor and /analytics for the configured server.');
} catch (error) {
  if (error.code === 50001) {
    console.error('Discord denied guild command registration. Install this application in the configured server with the applications.commands scope, then retry.');
    process.exitCode = 1;
  } else throw error;
}
