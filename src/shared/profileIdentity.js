export function profileName(value, username) {
  const name = String(value || '').trim();
  return !name || name.toLowerCase() === 'your name' ? String(username || '').trim() : name;
}
