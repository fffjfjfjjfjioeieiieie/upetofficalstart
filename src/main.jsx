import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './redesign/App.jsx';
import './redesign/index.css';

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Analytics />
  </>,
);

