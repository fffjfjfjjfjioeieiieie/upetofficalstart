export const TRUSTED_ROLES = Object.freeze(['founder', 'admin', 'moderator', 'support']);

export function trustedRolesFromClaims(claims = {}) {
  const candidates = [
    ...(Array.isArray(claims.roles) ? claims.roles : []),
    ...(typeof claims.role === 'string' ? [claims.role] : []),
    ...(claims.founder === true ? ['founder'] : []),
    ...(claims.admin === true ? ['admin'] : []),
    ...(claims.moderator === true ? ['moderator'] : []),
    ...(claims.support === true ? ['support'] : []),
  ];
  return [...new Set(candidates.filter((role) => TRUSTED_ROLES.includes(role)))];
}

export function hasTrustedRole(actor, ...roles) {
  if (!actor?.uid) return false;
  const trusted = new Set(trustedRolesFromClaims(actor.claims));
  return roles.some((role) => trusted.has(role));
}

export function assertTrustedRole(actor, ...roles) {
  if (!hasTrustedRole(actor, ...roles)) {
    throw new Error(`A trusted ${roles.join(' or ')} role is required.`);
  }
  return actor;
}

export function assertProfileOwner(actor, profile) {
  if (!actor?.uid || actor.uid !== profile?.ownerUid) {
    throw new Error('Only the profile owner can perform this operation.');
  }
  return actor;
}
