import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RATE_LIMITS } from '../../shared/rateLimits.js';
const optedOut = () => localStorage.getItem('upet-analytics-optout') === 'yes';
const recentEvents = new Map();
const referringOrigin = () => {
  try { return document.referrer ? new URL(document.referrer).origin : ''; }
  catch { return ''; }
};

export async function visitorEvent(type, route = window.location.pathname, feature = '') {
  if (optedOut()) return;
  const eventKey = `${type}:${route}:${feature}`;
  const now = Date.now();
  const minimumGap = type === 'page' ? RATE_LIMITS.pageEventDedupMs : RATE_LIMITS.featureEventDedupMs;
  if (now - (recentEvents.get(eventKey) || 0) < minimumGap) return;
  recentEvents.set(eventKey, now);
  if (recentEvents.size > 200) {
    for (const [key, time] of recentEvents) if (now - time > 60_000) recentEvents.delete(key);
  }
  const body = { mode: 'aggregate', type, route, referrer: referringOrigin(), ...(feature ? { feature } : {}) };
  try {
    await fetch('/api/visitor', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
  } catch { /* Analytics must not interrupt the website. */ }
}

export default function VisitorTracking() {
  const { pathname } = useLocation();
  useEffect(() => {
    visitorEvent('page', pathname);
  }, [pathname]);
  useEffect(() => {
    const clicked = (event) => {
      const element = event.target instanceof Element ? event.target.closest('a,button,[role="menuitem"]') : null;
      if (!element || element.closest('[data-testid*="entry"]')) return;
      const explicit = element.getAttribute('data-analytics-feature');
      const testId = element.getAttribute('data-testid') || '';
      const href = element.getAttribute('href') || '';
      let feature = explicit || '';
      if (!feature && testId.startsWith('profile-link-')) feature = 'Profile links';
      else if (!feature && ['profile-player-open', 'profile-streaming-player'].includes(testId)) feature = 'Music player';
      else if (!feature && (testId.startsWith('explore-user-') || testId.startsWith('top-profile-') || testId === 'menu-go-to-page')) feature = 'Open profile';
      else if (!feature && testId === 'menu-dashboard') feature = 'Dashboard';
      else if (!feature && testId === 'header-login-button') feature = 'Log in';
      else if (!feature && testId === 'theme-toggle') feature = 'Theme';
      else if (!feature && href === '/explore') feature = 'Explore profiles';
      else if (!feature && href === '/dashboard/editor') feature = 'Profile editor';
      else if (!feature && href === '/dashboard') feature = 'Dashboard';
      if (feature) visitorEvent('feature', pathname, feature);
    };
    document.addEventListener('click', clicked, true);
    return () => document.removeEventListener('click', clicked, true);
  }, [pathname]);
  return null;
}
