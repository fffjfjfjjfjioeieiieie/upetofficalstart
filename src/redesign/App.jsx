import "@/App.css";
import { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { Toaster } from "sonner";
import { StoreProvider, useStore } from "./lib/store";
import { WaveBackground } from "./components/WaveBackground";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import VisitorTracking from './components/VisitorTracking';
import { lazyWithRetry } from './lib/lazyWithRetry';
import { RouteErrorBoundary, RouteLoading } from './components/RouteState';

const Explore = lazyWithRetry(() => import('./pages/Explore'), 'explore');
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'), 'profile');
const DonatePage = lazyWithRetry(() => import('./pages/DonatePage'), 'donate');
const Dashboard = lazyWithRetry(() => import('./pages/dashboard/DashboardRoute'), 'dashboard');
const ComingSoon = lazyWithRetry(() => import('./pages/ComingSoon'), 'coming-soon');
const Login = lazyWithRetry(() => import('./pages/Login'), 'login');
const ClaimUsername = lazyWithRetry(() => import('./pages/ClaimUsername'), 'claim');
const Privacy = lazyWithRetry(() => import('./pages/Privacy'), 'privacy');

const dashboardImports = {
  overview: () => import('./pages/dashboard/Overview'),
  editor: () => import('./pages/dashboard/Editor'),
  donations: () => import('./pages/dashboard/Donations'),
  profiles: () => import('./pages/dashboard/Presets'),
  badges: () => import('./pages/dashboard/Badges'),
  leaderboard: () => import('./pages/dashboard/Leaderboard'),
  settings: () => import('./pages/dashboard/Settings'),
  visitors: () => import('./pages/dashboard/VisitorAnalytics'),
  modview: () => import('./pages/dashboard/Modview'),
};

const NAMES = { "": "Home", explore: "Explore", legal: "Legal", login: "Login", privacy: "Privacy", terms: "Terms", support: "Support", status: "Status", changelog: "Changelog", 'business-verification': 'Business verification' };

const TitleSync = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const [first = "", second] = pathname.split("/").filter(Boolean);
    const cap = (w) => w[0].toUpperCase() + w.slice(1);
    const name = first === "dashboard" ? `Dashboard - ${cap(second || "overview")}` : first === 'business' ? 'Business mode' : NAMES[first] || `@${first}`;
    document.title = `user.pet | ${name}`;
  }, [pathname]);
  return null;
};

const RoutePreloader = () => {
  const { pathname } = useLocation();
  const { user } = useStore();
  useEffect(() => {
    if (pathname.startsWith('/dashboard')) {
      Dashboard.preload().catch(() => {});
      const parts = pathname.split('/');
      const section = parts[2] || 'overview';
      const loader = dashboardImports[section];
      loader?.().catch(() => {});
      return undefined;
    }
    const saveData = navigator.connection?.saveData;
    const slow = /(^|-)2g$/.test(navigator.connection?.effectiveType || '');
    if (saveData || slow) return undefined;
    const preload = () => {
      Explore.preload().catch(() => {});
      if (user) Dashboard.preload().catch(() => {});
    };
    const id = window.requestIdleCallback ? window.requestIdleCallback(preload, { timeout: 1800 }) : window.setTimeout(preload, 600);
    return () => window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id);
  }, [pathname, user]);
  return null;
};

const RetiredProfilePage = () => {
  const { username } = useParams();
  return <Navigate to={`/${encodeURIComponent(username)}`} replace />;
};

const Shell = ({ children }) => (
  <>
    <Header />
    <main className="min-h-screen pt-36">{children}</main>
    <Footer />
  </>
);

const Guard = ({ children }) => {
  const { user, ready, needsClaim } = useStore();
  const loc = useLocation();
  if (!ready) return <RouteLoading label="Loading your account…" />;
  if (needsClaim) return <Navigate to="/claim" replace />;
  return user ? children : <Navigate to={`/login?next=${loc.pathname}`} replace />;
};

const Themed = () => {
  const { theme } = useStore();
  return <Toaster theme={theme} position="bottom-right" richColors />;
};

function App() {
  return (
    <StoreProvider>
      <div className="App">
        <WaveBackground />
        <BrowserRouter>
          <TitleSync />
          <RoutePreloader />
          <VisitorTracking />
          <RouteErrorBoundary><Suspense fallback={<RouteLoading />}><Routes>
            <Route path="/" element={<Shell><Home /></Shell>} />
            <Route path="/explore" element={<Shell><Explore /></Shell>} />
            <Route path="/marketplace" element={<Navigate to="/explore" replace />} />
            <Route path="/business-verification" element={<Navigate to="/" replace />} />
            <Route path="/legal" element={<Shell><ComingSoon name="Legal" /></Shell>} />
            <Route path="/privacy" element={<Shell><Privacy /></Shell>} />
            {["terms", "support", "status", "changelog"].map((p) => (
              <Route key={p} path={`/${p}`} element={<Shell><ComingSoon name={p[0].toUpperCase() + p.slice(1)} /></Shell>} />
            ))}
            <Route path="/login" element={<Shell><Login /></Shell>} />
            <Route path="/claim" element={<Shell><ClaimUsername /></Shell>} />
            <Route path="/shop-auth" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/*" element={<Guard><Dashboard /></Guard>} />
            <Route path="/business" element={<Navigate to="/" replace />} />
            <Route path="/business/:id/*" element={<Navigate to="/" replace />} />
            <Route path="/biz/:id" element={<Navigate to="/" replace />} />
            <Route path="/:username/shop/chat/:threadId" element={<RetiredProfilePage />} />
            <Route path="/:username/shop" element={<RetiredProfilePage />} />
            <Route path="/:username/donate" element={<DonatePage />} />
            <Route path="/:username" element={<ProfilePage />} />
          </Routes></Suspense></RouteErrorBoundary>
        </BrowserRouter>
        <Themed />
      </div>
    </StoreProvider>
  );
}

export default App;
