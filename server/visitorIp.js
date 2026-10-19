import { isIP } from 'node:net';

export function requestIp(request) {
  const candidate = String(request.headers['x-vercel-forwarded-for'] || request.headers['x-real-ip'] || request.socket?.remoteAddress || '').split(',')[0].trim();
  return isIP(candidate) ? candidate : '';
}

export async function inspectIp(ip) {
  if (!ip || !process.env.PROXYCHECK_API_KEY) return { status: 'unavailable' };
  try {
    const url = new URL(`https://proxycheck.io/v3/${encodeURIComponent(ip)}`);
    url.searchParams.set('key', process.env.PROXYCHECK_API_KEY);
    url.searchParams.set('tag', '0');
    const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!response.ok) return { status: 'unavailable' };
    const json = await response.json();
    const record = json[ip];
    if (!record) return { status: 'unavailable' };
    const flag = (value) => value === true || value === 'yes' || value === 'true';
    const network = record.network || {};
    const location = record.location || {};
    const detections = record.detections || {};
    return { status: 'ok', city: location.city || '', region: location.region || '', country: location.country || '', isp: network.provider || '', asn: network.asn || '', organisation: network.organisation || '', provider: record.operator?.name || network.provider || '', network: network.type || '', vpn: flag(detections.vpn), proxy: flag(detections.proxy), tor: flag(detections.tor), datacenter: flag(detections.hosting) || network.type === 'Hosting', confidence: detections.confidence ?? null };
  } catch { return { status: 'unavailable' }; }
}
