import { lazy, Suspense } from 'react';
import PublicHome from './pages/public-home/PublicHome.jsx';

// Keep the marketing entry independent from the authenticated application.
// The existing application owns Firebase, the store and every non-root route.
const AuthenticatedApp = lazy(() => import('./App.jsx'));

export default function PublicApp() {
  if (window.location.pathname === '/') return <PublicHome />;
  return <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Opening user.pet…</div>}><AuthenticatedApp /></Suspense>;
}
