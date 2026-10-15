export function safeExternalUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

export function safeAssetUrl(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  return safeExternalUrl(trimmed);
}

export function plainText(value, maxLength = 280) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength);
}

export function hasTemporaryAsset(value) {
  if (typeof value === 'string') return value.startsWith('blob:') || value.startsWith('data:');
  if (Array.isArray(value)) return value.some(hasTemporaryAsset);
  if (value && typeof value === 'object') return Object.values(value).some(hasTemporaryAsset);
  return false;
}
