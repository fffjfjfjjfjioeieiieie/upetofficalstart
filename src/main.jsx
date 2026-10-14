import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/sora';
import '@fontsource-variable/outfit';
import '@fontsource/orbitron/600.css';
import '@fontsource/pixelify-sans/500.css';
import App from './app/App.jsx';
import './app/styles.css';

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Analytics />
  </>,
);

