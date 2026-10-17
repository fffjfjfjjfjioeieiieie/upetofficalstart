import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './redesign/App.jsx';
import HelpApp from './help/HelpApp.jsx';
import './redesign/index.css';

const helpHost = window.location.hostname === 'help.user.pet';
const helpPreview = window.location.pathname === '/help-preview' || window.location.pathname.startsWith('/help-preview/');

createRoot(document.getElementById('root')).render(
  <>
    {helpHost || helpPreview ? <HelpApp basename={helpPreview ? '/help-preview' : undefined} /> : <App />}
    <Analytics />
  </>,
);

