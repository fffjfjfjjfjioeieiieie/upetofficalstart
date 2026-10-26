const snowflake = (value) => /^\d{17,20}$/.test(String(value || '')) ? String(value) : '';
const hash = (value) => /^(?:a_)?[a-f\d]{16,128}$/i.test(String(value || '')) ? String(value) : '';
const cdn = 'https://cdn.discordapp.com';
const image = (path, asset, size) => {
  const safe = hash(asset);
  if (!safe) return '';
  const animated = safe.startsWith('a_');
  return `${cdn}/${path}/${safe}.${animated ? 'gif' : 'png'}${size ? `?size=${size}` : ''}`;
};

// Only fields returned by the identify scope are published. OAuth tokens never enter this object.
export function discordPublicProfile(user) {
  const id = snowflake(user?.id);
  if (!id || typeof user?.username !== 'string' || !user.username.trim()) throw new Error('Discord account details could not be loaded.');
  const guild = user.primary_guild;
  const guildId = guild?.identity_enabled === true ? snowflake(guild.identity_guild_id) : '';
  const guildTag = guildId && typeof guild.tag === 'string' ? guild.tag.slice(0, 4) : '';
  const accentColor = Number.isInteger(user.accent_color) && user.accent_color >= 0 && user.accent_color <= 0xffffff
    ? `#${user.accent_color.toString(16).padStart(6, '0')}` : '';
  return {
    id,
    username: String(user.global_name || user.username).slice(0, 80),
    handle: user.username.slice(0, 80),
    avatar: image(`avatars/${id}`, user.avatar, 256),
    banner: image(`banners/${id}`, user.banner, 600),
    decoration: hash(user.avatar_decoration_data?.asset)
      ? `${cdn}/avatar-decoration-presets/${hash(user.avatar_decoration_data.asset)}.png?size=160`
      : '',
    guildTag,
    guildBadge: guildTag ? image(`guild-tag-badges/${guildId}`, guild.badge, 48) : '',
    publicFlags: Number.isSafeInteger(user.public_flags) && user.public_flags >= 0 ? user.public_flags : 0,
    accentColor,
    fetchedAt: Date.now(),
  };
}

export const DISCORD_PUBLIC_BADGES = [
  [1 << 0, 'Discord Staff'],
  [1 << 1, 'Partnered Server Owner'],
  [1 << 2, 'HypeSquad Events'],
  [1 << 3, 'Bug Hunter'],
  [1 << 6, 'House Bravery'],
  [1 << 7, 'House Brilliance'],
  [1 << 8, 'House Balance'],
  [1 << 9, 'Early Supporter'],
  [1 << 14, 'Bug Hunter Level 2'],
  [1 << 16, 'Verified Bot'],
  [1 << 17, 'Early Verified Developer'],
  [1 << 18, 'Moderator Alumni'],
];

export function discordBadgeLabels(publicFlags) {
  const flags = Number.isSafeInteger(publicFlags) && publicFlags >= 0 ? publicFlags : 0;
  return DISCORD_PUBLIC_BADGES.filter(([bit]) => (flags & bit) !== 0).map(([, label]) => label);
}
