import "@/App.css";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { StoreProvider, useStore } from "./lib/store";
import { WaveBackground } from "./components/WaveBackground";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import ComingSoon from "./pages/ComingSoon";
import Login from "./pages/Login";
import ClaimUsername from "./pages/ClaimUsername";

const Explore = lazy(() => import('./pages/Explore'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));

const NAMES = { "": "Home", explore: "Explore", marketplace: "Marketplace", legal: "Legal", login: "Login", privacy: "Privacy", terms: "Terms", support: "Support", status: "Status", changelog: "Changelog" };

const TitleSync = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const [first = "", second] = pathname.split("/").filter(Boolean);
    const cap = (w) => w[0].toUpperCase() + w.slice(1);
    const name = first === "dashboard" ? `Dashboard - ${cap(second || "overview")}` : NAMES[first] || `@${first}`;
    document.title = `user.pet | ${name}`;
  }, [pathname]);
  return null;
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
  if (!ready) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading your account…</div>;
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
          <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">Loading…</div>}><Routes>
            <Route path="/" element={<Shell><Home /></Shell>} />
            <Route path="/explore" element={<Shell><Explore /></Shell>} />
            <Route path="/marketplace" element={<Shell><Marketplace /></Shell>} />
            <Route path="/legal" element={<Shell><ComingSoon name="Legal" /></Shell>} />
            {["privacy", "terms", "support", "status", "changelog"].map((p) => (
              <Route key={p} path={`/${p}`} element={<Shell><ComingSoon name={p[0].toUpperCase() + p.slice(1)} /></Shell>} />
            ))}
            <Route path="/login" element={<Shell><Login /></Shell>} />
            <Route path="/claim" element={<Shell><ClaimUsername /></Shell>} />
            <Route path="/dashboard/*" element={<Guard><Dashboard /></Guard>} />
            <Route path="/:username" element={<ProfilePage />} />
          </Routes></Suspense>
        </BrowserRouter>
        <Themed />
      </div>
    </StoreProvider>
  );
}

export default App;
