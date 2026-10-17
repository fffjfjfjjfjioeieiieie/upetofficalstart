const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const randomSecret = (len = 16) => {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
};

const base32ToBytes = (s) => {
  let bits = "";
  for (const ch of s.replace(/=+$/, "").toUpperCase()) bits += ALPHABET.indexOf(ch).toString(2).padStart(5, "0");
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return new Uint8Array(out);
};

export const totpAt = async (secret, counter) => {
  const key = await crypto.subtle.importKey("raw", base32ToBytes(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const buf = new ArrayBuffer(8);
  new DataView(buf).setUint32(4, counter);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
  const o = sig[19] & 15;
  const num = ((sig[o] & 127) << 24) | (sig[o + 1] << 16) | (sig[o + 2] << 8) | sig[o + 3];
  return String(num % 1000000).padStart(6, "0");
};

export const verifyTotp = async (secret, code) => {
  const now = Math.floor(Date.now() / 30000);
  for (const d of [-1, 0, 1]) if ((await totpAt(secret, now + d)) === String(code).trim()) return true;
  return false;
};

export const otpauthUrl = (secret, username) =>
  `otpauth://totp/user.pet:${encodeURIComponent(username)}?secret=${secret}&issuer=user.pet`;
