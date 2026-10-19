import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './redesign/App.jsx';
import HelpApp from './help/HelpApp.jsx';
import './redesign/index.css';

const helpHost = window.location.hostname === 'help.user.pet';
const helpPreview = window.location.pathname === '/help-preview' || window.location.pathname.startsWith('/help-preview/');

function VisitorStatistics() {
  const [allowed, setAllowed] = React.useState(() => localStorage.getItem('upet-analytics-optout') !== 'yes');
  React.useEffect(() => {
    const update = () => setAllowed(localStorage.getItem('upet-analytics-optout') !== 'yes');
    window.addEventListener('upet-analytics-choice', update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener('upet-analytics-choice', update); window.removeEventListener('storage', update); };
  }, []);
  return allowed ? <Analytics /> : null;
}

createRoot(document.getElementById('root')).render(
  <>
    {helpHost || helpPreview ? <HelpApp basename={helpPreview ? '/help-preview' : undefined} /> : <App />}
    <VisitorStatistics />
  </>,
);

