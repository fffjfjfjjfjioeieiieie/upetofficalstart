import React from 'react';
const FOUNDER_EMAILS = new Set(['zurihcs@gmail.com', 'lampjustlamp123@gmail.com', 'iamjayvonlol@gmail.com', 'riotsoffical@proton.me']);
export function isApprovedFounder(user) { return Boolean(user?.uid && FOUNDER_EMAILS.has(String(user.email || '').trim().toLowerCase())); }
export default function FounderGate({ user, children }) { return isApprovedFounder(user) ? children : null; }
