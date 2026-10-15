import React from 'react';
export default function AuthGate({ ready, user, children }) {
  if (!ready) return <div className="route-auth-loading" role="status">Checking your session…</div>;
  return user ? children : null;
}
