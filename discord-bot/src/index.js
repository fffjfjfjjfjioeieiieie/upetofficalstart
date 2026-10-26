import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';

const { DISCORD_TOKEN } = process.env;
if (!DISCORD_TOKEN) throw new Error('Configure DISCORD_TOKEN before starting.');

// The former visitor lookup and analytics bot has been retired. This process
// intentionally makes no requests to user.pet and handles no interactions.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.on(Events.Error, (error) => console.error('Discord client error:', error));
client.once(Events.ClientReady, (ready) => console.log(`Retired user.pet bot connected as ${ready.user.tag}; visitor commands are disabled.`));
await client.login(DISCORD_TOKEN);
