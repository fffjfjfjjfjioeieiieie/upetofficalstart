import test from 'node:test';
import assert from 'node:assert/strict';
import { discordBadgeLabels, discordPublicProfile } from '../src/shared/discordProfile.js';
import { documentFromRedesign, redesignFromDocument } from '../src/redesign/lib/profileModel.js';

test('Discord identify data becomes a public snapshot without OAuth secrets', () => {
  const connection = discordPublicProfile({
    id: '123456789012345678', username: 'actual.user', global_name: 'Display Name',
    avatar: 'a_1234567890abcdef', banner: '1234567890abcdef',
    avatar_decoration_data: { asset: 'a_abcdef1234567890', sku_id: '987654321098765432' },
    primary_guild: { identity_guild_id: '987654321098765432', identity_enabled: true, tag: 'TEST', badge: 'abcdef1234567890' },
    public_flags: (1 << 3) | (1 << 9), accent_color: 0x5865f2,
    email: 'private@example.com', access_token: 'never-publish', premium_type: 2,
  });
  assert.equal(connection.username, 'Display Name');
  assert.equal(connection.handle, 'actual.user');
  assert.equal(connection.id, '123456789012345678');
  assert.match(connection.avatar, /avatars\/123456789012345678\/a_1234567890abcdef\.gif/);
  assert.match(connection.banner, /banners\/123456789012345678\/1234567890abcdef\.png/);
  assert.match(connection.decoration, /avatar-decoration-presets\/a_abcdef1234567890\.png/);
  assert.equal(connection.guildTag, 'TEST');
  assert.match(connection.guildBadge, /guild-tag-badges\/987654321098765432\/abcdef1234567890\.png/);
  assert.deepEqual(discordBadgeLabels(connection.publicFlags), ['Bug Hunter', 'Early Supporter']);
  assert.equal(connection.accentColor, '#5865f2');
  assert.equal('access_token' in connection, false);
  assert.equal('email' in connection, false);
  assert.equal('premium_type' in connection, false);
});

test('missing optional Discord fields stay absent and disabled guild identities stay hidden', () => {
  const connection = discordPublicProfile({ id: '123456789012345678', username: 'friend', primary_guild: { identity_enabled: false, tag: 'NOPE', badge: 'abcdef1234567890' } });
  assert.equal(connection.username, 'friend');
  assert.equal(connection.banner, '');
  assert.equal(connection.decoration, '');
  assert.equal(connection.guildTag, '');
  assert.equal(connection.guildBadge, '');
  assert.deepEqual(discordBadgeLabels(connection.publicFlags), []);
});

test('Discord widget snapshot and customization survive profile publication', () => {
  const widgets = { discord: { enabled: true, userId: '123456789012345678', username: 'Display Name', handle: 'actual.user', banner: 'https://cdn.discordapp.com/banners/123456789012345678/1234567890abcdef.png', decoration: 'https://cdn.discordapp.com/avatar-decoration-presets/a_abcdef1234567890.png', guildTag: 'TEST', publicFlags: 8, layout: 'expanded', showBanner: false, showBadges: false, glow: .7, alpha: .8, radius: 24, accent: '#5865f2' } };
  const restored = redesignFromDocument(documentFromRedesign({ widgets }, 'owner', 'friend'), 'friend');
  assert.equal(restored.widgets.discord.handle, 'actual.user');
  assert.equal(restored.widgets.discord.layout, 'expanded');
  assert.equal(restored.widgets.discord.showBanner, false);
  assert.equal(restored.widgets.discord.showBadges, false);
  assert.equal(restored.widgets.discord.glow, .7);
  assert.equal(restored.widgets.discord.guildTag, 'TEST');
});
