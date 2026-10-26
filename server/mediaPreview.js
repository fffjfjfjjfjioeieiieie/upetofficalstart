const blobHost = (hostname) => hostname.endsWith('.blob.vercel-storage.com');

export function allowedPreviewHosts(publicBaseUrl = process.env.R2_PUBLIC_BASE_URL) {
  const hosts = new Set();
  if (publicBaseUrl) {
    try { hosts.add(new URL(publicBaseUrl).hostname); } catch { /* Ignore an invalid optional R2 URL. */ }
  }
  return hosts;
}

export function isAllowedPreviewSource(value, publicBaseUrl) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && (blobHost(url.hostname) || allowedPreviewHosts(publicBaseUrl).has(url.hostname));
  } catch {
    return false;
  }
}

export function previewWidth(value) {
  const width = Math.round(Number(value) || 640);
  return Math.min(900, Math.max(160, width));
}
