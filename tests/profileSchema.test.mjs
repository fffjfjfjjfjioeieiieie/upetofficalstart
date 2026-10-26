import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileDocument, migrateProfile, toRendererProfile, validateProfileForSave } from '../src/shared/profileSchema.js';
import { redesignFromDocument, documentFromRedesign, sanitizeRedesignProfile } from '../src/redesign/lib/profileModel.js';
import { profileName } from '../src/shared/profileIdentity.js';
import { createEntryPassword, verifyEntryPassword } from '../src/redesign/lib/entryPassword.js';

test('connected shop and its profile visibility survive profile publication',()=>{
  for(const enabled of [true,false]){
    const profile=sanitizeRedesignProfile({shop:{connected:true,enabled,name:'My store'}},'shop-owner');
    const restored=redesignFromDocument(documentFromRedesign(profile,'owner','shop-owner'),'shop-owner');
    assert.equal(restored.shop.connected,true);
    assert.equal(restored.shop.enabled,enabled);
    assert.equal(restored.shop.name,'My store');
  }
});

test('small profile cards and minimal styling save and round-trip across all editor widths', () => {
  for (const width of [280, 300, 319, 320, 440, 620, 900]) {
    const profile = sanitizeRedesignProfile({ card: { width, layout: 'minimal', alpha: 0, radius: 0, blur: 0, borderAlpha: 0, tilt: false } }, 'mobile-user');
    const saved = documentFromRedesign(profile, 'owner', 'mobile-user');
    assert.equal(saved.theme.width, width);
    const restored = redesignFromDocument(saved, 'mobile-user');
    assert.equal(restored.card.width, width);
    assert.equal(restored.card.alpha, 0);
    assert.equal(restored.card.radius, 0);
    assert.equal(restored.card.blur, 0);
    assert.equal(restored.card.borderAlpha, 0);
  }
});

test('entry settings survive publication and entry passwords verify', async () => {
  const password = await createEntryPassword('secret phrase');
  const profile = sanitizeRedesignProfile({ entry: { mode: 'password', title: 'Welcome', subtitle: 'Come in', textEffect: 'glitch', ...password } }, 'lamp');
  const saved = documentFromRedesign(profile, 'owner', 'lamp');
  const publicProfile = redesignFromDocument(saved, 'lamp');
  assert.equal(publicProfile.entry.mode, 'password');
  assert.equal(publicProfile.entry.title, 'Welcome');
  assert.equal(publicProfile.entry.textEffect, 'glitch');
  assert.equal(await verifyEntryPassword('secret phrase', publicProfile.entry), true);
  assert.equal(await verifyEntryPassword('wrong phrase', publicProfile.entry), false);
  assert.equal(redesignFromDocument(null, 'kid').entry.mode, 'button');
});

test('new and existing placeholder profiles use their claimed username', () => {
  assert.equal(redesignFromDocument(null, 'kid').displayName, 'kid');
  assert.equal(redesignFromDocument(null, 'kid').alias, 'kid');
  assert.equal(redesignFromDocument({ redesign: { displayName: 'your name', alias: 'Your Name' } }, 'kid').displayName, 'kid');
  assert.equal(profileName('A chosen name', 'kid'), 'A chosen name');
});

test('background effect amount and color survive publication', () => {
  const profile = sanitizeRedesignProfile({ effects: { background: 'stars', backgroundAmount: 73, backgroundColor: '#f5c8ff' } }, 'stars');
  const restored = redesignFromDocument(documentFromRedesign(profile, 'owner', 'stars'), 'stars');

  assert.equal(restored.effects.background, 'stars');
  assert.equal(restored.effects.backgroundAmount, 73);
  assert.equal(restored.effects.backgroundColor, '#f5c8ff');
  assert.equal(sanitizeRedesignProfile({ effects: { backgroundAmount: 999, backgroundColor: 'bad' } }, 'stars').effects.backgroundAmount, 100);
});

test('music player and lyric preferences sanitize safely and survive publication', () => {
  const profile = sanitizeRedesignProfile({ audio: { src: 'https://cdn.example/song.mp3', playerPlacement: 'right', popupOnLoad: true, popupSide: 'right', playerBackground: '#222222', playerTextColor: '#abcdef', playerOpacity: .6, playerScale: 120, playerRadius: 20, playerBlur: 8, playerCoverSize: 55, playerEffect: 'glow', playerShowProgress: true, playerProgressStyle: 'glow', playerProgressHeight: 7, playerProgressColor: '#fedcba', playerProgressGlow: true, playerShowCover: false, playerShowArtist: false, playerBorder: false, expandedEnabled: true, expandedStyle: 'artwork', expandedBackground: '#121212', expandedTextColor: '#ededed', expandedOpacity: .8, expandedRadius: 18, expandedBlur: 12, expandedWidth: 600, expandedArtworkSize: 300, expandedEffect: 'gradient', expandedShowTimes: false, expandedShowSkip: false, expandedShowLyrics: false, lyrics: { enabled: true, textEffect: 'glow', alignment: 'left', display: 'right', textColor: '#aabbcc', activeColor: '#123456', textSize: 28, panelStyle: 'clear', sideVertical: 'bottom', sideWidth: 500, sideInset: 7, sideTextSize: 72, popout: true, lines: [{ id: 'l1', time: 12, endTime: 16, text: 'First line' }] } } }, 'music');
  const published = documentFromRedesign(profile, 'owner', 'music');
  const restored = redesignFromDocument(published, 'music');
  assert.equal(restored.audio.playerPlacement, 'right');
  assert.equal(restored.audio.popupOnLoad, true);
  assert.equal(restored.audio.popupSide, 'right');
  assert.equal(restored.audio.playerBackground, '#222222');
  assert.equal(restored.audio.playerOpacity, .6);
  assert.equal(restored.audio.playerScale, 120);
  assert.equal(restored.audio.playerRadius, 20);
  assert.equal(restored.audio.playerBlur, 8);
  assert.equal(restored.audio.playerCoverSize, 55);
  assert.equal(restored.audio.playerEffect, 'glow');
  assert.equal(restored.audio.playerShowProgress, true);
  assert.equal(restored.audio.playerProgressStyle, 'glow');
  assert.equal(restored.audio.playerProgressHeight, 7);
  assert.equal(restored.audio.playerProgressColor, '#fedcba');
  assert.equal(restored.audio.playerProgressGlow, true);
  assert.equal(restored.audio.playerShowCover, false);
  assert.equal(restored.audio.playerShowArtist, false);
  assert.equal(restored.audio.playerBorder, false);
  assert.equal(restored.audio.expandedEnabled, true);
  assert.equal(restored.audio.expandedStyle, 'artwork');
  assert.equal(restored.audio.expandedBackground, '#121212');
  assert.equal(restored.audio.expandedTextColor, '#ededed');
  assert.equal(restored.audio.expandedOpacity, .8);
  assert.equal(restored.audio.expandedRadius, 18);
  assert.equal(restored.audio.expandedBlur, 12);
  assert.equal(restored.audio.expandedWidth, 600);
  assert.equal(restored.audio.expandedArtworkSize, 300);
  assert.equal(restored.audio.expandedEffect, 'gradient');
  assert.equal(restored.audio.expandedShowTimes, false);
  assert.equal(restored.audio.expandedShowSkip, false);
  assert.equal(restored.audio.expandedShowLyrics, false);
  assert.equal(restored.audio.lyrics.textEffect, 'glow');
  assert.equal(restored.audio.lyrics.alignment, 'left');
  assert.equal(restored.audio.lyrics.display, 'right');
  assert.equal(restored.audio.lyrics.textColor, '#aabbcc');
  assert.equal(restored.audio.lyrics.activeColor, '#123456');
  assert.equal(restored.audio.lyrics.textSize, 28);
  assert.equal(restored.audio.lyrics.panelStyle, 'clear');
  assert.equal(restored.audio.lyrics.sideVertical, 'bottom');
  assert.equal(restored.audio.lyrics.sideWidth, 500);
  assert.equal(restored.audio.lyrics.sideInset, 7);
  assert.equal(restored.audio.lyrics.sideTextSize, 72);
  assert.equal(restored.audio.lyrics.popout, true);
  assert.equal(restored.audio.lyrics.lines[0].time, 12);
  assert.equal(restored.audio.lyrics.lines[0].endTime, 16);
  assert.equal(restored.audio.lyrics.lines[0].synced, true);
  const untimed = sanitizeRedesignProfile({ audio: { lyrics: { lines: [{ id: 'draft', text: 'Waiting', time: 0, synced: false }] } } }, 'music');
  assert.equal(untimed.audio.lyrics.lines[0].synced, false);
  assert.equal(sanitizeRedesignProfile({}, 'music').audio.expandedEnabled, false);
  assert.equal(sanitizeRedesignProfile({ audio: { playerPlacement: 'unsupported', popupSide: 'up', lyrics: { textEffect: 'flash', alignment: 'diagonal' } } }, 'music').audio.playerPlacement, 'card');
});

test('founder profiles receive every official badge once', () => {
  const dome = sanitizeRedesignProfile({}, 'dome');
  assert.equal(dome.badges.includes('founder'), true);
  assert.equal(dome.badges.includes('owner'), false);
  assert.equal(dome.shownBadges.includes('founder'), true);
  assert.equal(dome.badges.length, 9);
  assert.equal(new Set(dome.badges).size, 9);
  const lamp = sanitizeRedesignProfile({}, 'lamp');
  assert.deepEqual(lamp.badges, dome.badges);
});

test('founder badge visibility and custom order survive publication', () => {
  const profile = sanitizeRedesignProfile({ badgeOrder: ['og', 'founder'], hiddenBadges: ['premium'] }, 'lamp');
  assert.deepEqual(profile.badges.slice(0, 2), ['og', 'founder']);
  assert.equal(profile.shownBadges.includes('premium'), false);
  const restored = redesignFromDocument(documentFromRedesign(profile, 'owner', 'lamp'), 'lamp');
  assert.deepEqual(restored.badges.slice(0, 2), ['og', 'founder']);
  assert.equal(restored.shownBadges.includes('premium'), false);
  assert.equal(restored.badges.includes('owner'), false);
});

test('legacy Dome fields migrate to a versioned document without losing music or links', () => {
  const document = migrateProfile({ username: 'dome', displayName: 'dome', audioUrl: '/song.mp3', trackTitle: 'Lucid Dreams', trackArtist: 'Juice WRLD', links: [{ label: 'Discord', url: 'https://discord.gg/upet' }] });
  assert.equal(document.schemaVersion, 1);
  assert.equal(document.audio.tracks[0].title, 'Lucid Dreams');
  assert.equal(document.blocks[0].content.url, 'https://discord.gg/upet');
  assert.equal(toRendererProfile(document, { username: 'dome' }).links[0].label, 'Discord');
});

test('legacy click sounds are discarded while profile music remains available', () => {
  const document = migrateProfile({ username: 'lamp', audioUrl: '/music.mp3', clickSoundEnabled: true, clickSoundUrl: '/tick.mp3', clickSoundVolume: 100 });
  const renderer = toRendererProfile(document, { username: 'lamp' });
  assert.equal(renderer.audioUrl, '/music.mp3');
  assert.equal('clickSoundEnabled' in renderer, false);
  assert.equal('clickSoundUrl' in renderer, false);
  assert.equal('clickSound' in document.effects, false);
  const published = createProfileDocument({ username: 'lamp' });
  published.effects.clickSound = '/tick.mp3';
  published.effects.clickSoundEnabled = true;
  assert.equal('clickSound' in migrateProfile(published).effects, false);
});

test('draft and renderer preserve ordered blocks', () => {
  const document = createProfileDocument({ username: 'lamp' });
  document.blocks.push({ id: 'one', type: 'heading', enabled: true, order: 0, style: {}, content: { text: 'Hello' } });
  assert.deepEqual(validateProfileForSave(document).blocks, document.blocks);
  assert.equal(toRendererProfile(document, { username: 'lamp' }).blocks[0].content.text, 'Hello');
});

test('temporary assets cannot be saved', () => {
  const document = createProfileDocument({ username: 'lamp' });
  document.identity.avatar = 'blob:preview';
  assert.throws(() => validateProfileForSave(document), /upload is still previewing/i);
});

test('new customization controls default safely and reach the shared renderer', () => {
  const original = createProfileDocument({ username: 'dome' });
  const legacyV1 = structuredClone(original);
  delete legacyV1.behavior;
  delete legacyV1.theme.avatar.borderWidth;
  delete legacyV1.audio.showProgress;
  const migrated = migrateProfile(legacyV1);
  assert.equal(migrated.behavior.linkAction, 'open');
  assert.equal(migrated.theme.avatar.borderWidth, 4);
  assert.equal(migrated.audio.showProgress, true);

  migrated.behavior.linkAction = 'both';
  migrated.behavior.analyticsEnabled = false;
  migrated.background.scale = 125;
  migrated.effects.cursorHotspotX = 8;
  const renderer = toRendererProfile(migrated, { username: 'dome' });
  assert.equal(renderer.linkAction, 'both');
  assert.equal(renderer.analyticsEnabled, false);
  assert.equal(renderer.backgroundScale, 125);
  assert.equal(renderer.cursorHotspotX, 8);
});

