const hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (value) => new Uint8Array(value.match(/../g).map((pair) => parseInt(pair, 16)));

async function derive(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
  return hex(new Uint8Array(bits));
}

export async function createEntryPassword(password) {
  if (password.length < 8) throw new Error('Use at least 8 characters.');
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return { passwordSalt: salt, passwordHash: await derive(password, salt) };
}

export async function verifyEntryPassword(password, entry) {
  if (!entry?.passwordSalt || !entry?.passwordHash) return false;
  const candidate = await derive(password, entry.passwordSalt);
  let difference = 0;
  for (let i = 0; i < entry.passwordHash.length; i += 1) difference |= candidate.charCodeAt(i) ^ entry.passwordHash.charCodeAt(i);
  return difference === 0;
}
