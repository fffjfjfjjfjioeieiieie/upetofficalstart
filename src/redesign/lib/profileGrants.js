export const BADGE_ORDER = ['founder', 'staff', 'verified', 'premium', 'og', 'booster', 'bughunter', 'donor', 'seller'];
// `owner` is retained only as a legacy identifier so old documents cannot turn
// it into a custom badge. Founder is the single ownership badge.
export const OFFICIAL_BADGES = new Set([...BADGE_ORDER, 'owner']);

export const orderBadges = (items = [], preferred = []) => {
  const values = new Set(items.filter((id) => id !== 'owner'));
  const chosen = [];
  for (const id of preferred) {
    if (values.has(id) && !chosen.includes(id)) chosen.push(id);
  }
  return [
    ...chosen,
    ...BADGE_ORDER.filter((id) => values.has(id) && !chosen.includes(id)),
    ...[...values].filter((id) => !OFFICIAL_BADGES.has(id) && !chosen.includes(id)),
  ];
};

export function applyProfileGrants(profile, granted = []) {
  const trusted = (Array.isArray(granted) ? granted : []).filter((id) => BADGE_ORDER.includes(id));
  const badges = orderBadges([...(profile.badges || []), ...trusted], profile.badgeOrder);
  const hasVisibilityPreferences = Array.isArray(profile.hiddenBadges);
  const hiddenBadges = hasVisibilityPreferences
    ? [...new Set(profile.hiddenBadges.filter((id) => badges.includes(id)))]
    : undefined;
  const shownBadges = hasVisibilityPreferences
    ? badges.filter((id) => !hiddenBadges.includes(id))
    : orderBadges([...(profile.shownBadges || []), ...trusted], profile.badgeOrder).filter((id) => badges.includes(id));
  return { ...profile, badges, shownBadges, badgeOrder: badges, ...(hasVisibilityPreferences ? { hiddenBadges } : {}) };
}
