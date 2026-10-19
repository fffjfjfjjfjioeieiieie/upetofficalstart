import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

const visitor = new SlashCommandBuilder().setName('visitor').setDescription('Inspect diagnostic test sessions').setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((s) => s.setName('info').setDescription('Visitor details').addStringOption((o) => o.setName('id').setDescription('Full visitor ID').setRequired(true)))
  .addSubcommand((s) => s.setName('network').setDescription('Enrolled diagnostic network').addStringOption((o) => o.setName('id').setDescription('Full visitor ID').setRequired(true)))
  .addSubcommand((s) => s.setName('history').setDescription('Visitor page and event history').addStringOption((o) => o.setName('id').setDescription('Full visitor ID').setRequired(true)))
  .addSubcommand((s) => s.setName('claim').setDescription('Verify your diagnostic test').addStringOption((o) => o.setName('id').setDescription('Claim code from the admin dashboard').setRequired(true)))
  .addSubcommand((s) => s.setName('recent').setDescription('Recent diagnostic tests'))
  .addSubcommand((s) => s.setName('myip').setDescription('My enrolled browser public IP'));
const analytics = new SlashCommandBuilder().setName('analytics').setDescription('Website traffic statistics').setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((s) => s.setName('live').setDescription('Active visitor count'))
  .addSubcommand((s) => s.setName('today').setDescription('Today traffic'))
  .addSubcommand((s) => s.setName('countries').setDescription('Country distribution'))
  .addSubcommand((s) => s.setName('security').setDescription('Bot and security activity'));

export const commands = [visitor.toJSON(), analytics.toJSON()];
