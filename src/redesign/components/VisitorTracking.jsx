import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { auth } from '../../app/firebase';

const optedOut = () => localStorage.getItem('upet-analytics-optout') === 'yes';

export async function visitorEvent(type, route = window.location.pathname) {
  if (optedOut()) return;
  const params = new URLSearchParams(window.location.search);
  const body = { mode: 'aggregate', type, route, referrer: document.referrer, utm: { source: params.get('utm_source'), medium: params.get('utm_medium'), campaign: params.get('utm_campaign') } };
  try {
    await fetch('/api/visitor', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (sessionStorage.getItem('upet-diagnostic-test') === 'yes' && auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      await fetch('/api/visitor', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ ...body, mode: 'diagnostic' }) });
    }
  } catch { /* Analytics must not interrupt the website. */ }
}

export default function VisitorTracking() {
  const { pathname } = useLocation();
  const previous = useRef(null);
  useEffect(() => {
    if (previous.current && previous.current !== pathname) visitorEvent('navigation', pathname);
    previous.current = pathname;
    visitorEvent('page', pathname);
  }, [pathname]);
  useEffect(() => {
    const timer = window.setInterval(() => visitorEvent('heartbeat'), 120000);
    const error = () => visitorEvent('error');
    window.addEventListener('error', error);
    window.addEventListener('unhandledrejection', error);
    return () => { clearInterval(timer); window.removeEventListener('error', error); window.removeEventListener('unhandledrejection', error); };
  }, []);
  return null;
}
