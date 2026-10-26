export const MAX_PROFILE_PRESETS = 5;

export function cleanPresetName(value) {
  const name = String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
  if (name.length < 1) throw new Error('Give this profile preset a name.');
  return name;
}

export function presetPreview(document = {}, username = '') {
  const profile = document?.redesign || {};
  return {
    username,
    alias: profile.alias,
    displayName: profile.displayName,
    bio: profile.bio,
    location: profile.location,
    badges: profile.badges,
    shownBadges: profile.shownBadges,
    hiddenBadges: profile.hiddenBadges,
    badgeOrder: profile.badgeOrder,
    media: profile.media,
    effects: profile.effects,
    entry: profile.entry,
    card: profile.card,
    links: Array.isArray(profile.links) ? profile.links.slice(0, 6) : [],
    widgets: profile.widgets,
    audio: { ...profile.audio, src: '', autoplay: false, lyrics: { ...profile.audio?.lyrics, lines: [] } },
    tooltips: profile.tooltips,
    badgeStyle: profile.badgeStyle,
    linkStyle: profile.linkStyle,
  };
}
