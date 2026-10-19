import React from 'react';
const FOUNDER_EMAILS = new Set(['zurihcs@gmail.com', 'lampjustlamp123@gmail.com', 'iamjayvonlol@gmail.com', 'riotsoffical@proton.me', 'daalt38@gmail.com', 'whatdidido6969@gmail.com']);
export function isApprovedFounder(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  return Boolean(user?.uid && FOUNDER_EMAILS.has(email) && (email !== 'whatdidido6969@gmail.com' || user.emailVerified));
}
export default function FounderGate({ user, children }) { return isApprovedFounder(user) ? children : null; }
