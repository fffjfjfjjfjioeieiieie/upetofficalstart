export const SID_PATTERN = /^[a-f0-9]{24}$/;
export function routeOf(value) {
  if (typeof value !== 'string' || value.length > 500) return '/';
  try {
    const path = new URL(value, 'https://user.pet').pathname;
    return path.startsWith('/') ? path.slice(0, 160) : '/';
  } catch { return '/'; }
}
export function clean(value, max = 80) {
  return typeof value === 'string' ? value.replace(/[<>\r\n]/g, '').slice(0, max) : '';
}
export function userAgent(value = '') {
  const ua = String(value).slice(0, 400);
  const device = /bot|crawler|spider/i.test(ua) ? 'Bot' : /ipad|tablet/i.test(ua) ? 'Tablet' : /mobile|iphone|android/i.test(ua) ? 'Mobile' : 'Desktop';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  const os = /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Other';
  return { device, browser, os };
}
export function sourceOf(value) {
  try { const host = new URL(String(value)).hostname.toLowerCase(); return host && host !== 'user.pet' && !host.endsWith('.user.pet') ? host.slice(0, 100) : 'Direct'; }
  catch { return 'Direct'; }
}
export function eventOf(body) {
  const type = ['page', 'navigation', 'conversion', 'error', 'heartbeat'].includes(body?.type) ? body.type : null;
  if (!type) return null;
  const route = routeOf(body.route);
  return { type, route, url: `https://user.pet${route}`, at: new Date().toISOString(), detail: type === 'error' ? clean(body.detail, 120) : '' };
}
