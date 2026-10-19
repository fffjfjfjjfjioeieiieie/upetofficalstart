import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { lazy, Suspense } from 'react';
import { motion } from "framer-motion";
import { LayoutGrid, PenTool, Award, Trophy, Settings as Cog, Store, LogOut, ExternalLink, Bell, ChartNoAxesCombined } from "lucide-react";
import { useStore } from "../../lib/store";
import { Logo } from "../../components/Logo";
import { Avatar } from "../../components/ProfileBits";
const Overview = lazy(() => import('./Overview'));
const Editor = lazy(() => import('./Editor'));
const Badges = lazy(() => import('./Badges'));
const Leaderboard = lazy(() => import('./Leaderboard'));
const Settings = lazy(() => import('./Settings'));
const Shop = lazy(() => import('../../shop/ShopEditor'));
const Notifications = lazy(() => import('./Notifications'));
const Conversation = lazy(() => import('./Conversation'));
const VisitorAnalytics = lazy(() => import('./VisitorAnalytics'));

const NAV = [
  ["overview", "Overview", LayoutGrid],
  ["editor", "Editor", PenTool],
  ["shop", "Shop", Store],
  ["notifications", "Notifications", Bell],
  ["badges", "Badges", Award],
  ["leaderboard", "Leaderboard", Trophy],
  ["settings", "Settings", Cog],
  ["visitors", "Visitors", ChartNoAxesCombined],
];

const Sidebar = () => {
  const { user, logout } = useStore();
  const nav = useNavigate();
  const out = () => { logout(); nav("/"); };
  return (
    <aside data-testid="dashboard-sidebar" className="glass fixed bottom-4 left-4 top-4 z-40 hidden w-64 flex-col rounded-[1.5rem] p-4 md:flex">
      <NavLink to="/" className="px-2 py-1" data-testid="sidebar-logo"><Logo /></NavLink>
      <nav className="mt-8 flex-1 space-y-1">
        {NAV.filter((n) => !n[3] || user.role === "admin").map(([path, label, Icon]) => (
          <NavLink key={path} to={`/dashboard/${path}`} data-testid={`sidebar-${path}`} className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"}`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="sidebar-active" className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-primary" />}
                <Icon className="h-4 w-4" />{label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <button data-testid="sidebar-view-page" onClick={() => nav(`/${user.username}`)} className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"><ExternalLink className="h-4 w-4" />View my page</button>
      <button data-testid="sidebar-logout" onClick={out} className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"><LogOut className="h-4 w-4" />Logout</button>
      <div data-testid="sidebar-profile-box" className="flex items-center gap-3 rounded-2xl border bg-background/50 p-3">
        <Avatar media={user.profile.media.avatar} name={user.username} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{user.username}</div>
          <div className="truncate text-xs text-muted-foreground">{user.profile.alias}</div>
        </div>
        <button data-testid="sidebar-profile-logout" onClick={out} title="Logout" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"><LogOut className="h-4 w-4" /></button>
      </div>
    </aside>
  );
};

const MobileNav = () => {
  const { user, saveState } = useStore();
  return (
    <>
      <header className="glass fixed inset-x-3 top-3 z-40 flex h-14 items-center justify-between rounded-2xl px-4 md:hidden">
        <NavLink to="/"><Logo /></NavLink>
        <span className="text-xs text-muted-foreground">{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : `@${user.username}`}</span>
      </header>
      <nav className="glass fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl p-1.5 md:hidden">
        {NAV.filter(([path]) => ['overview', 'editor', 'shop', 'notifications', 'visitors'].includes(path)).map(([path, label, Icon]) => (
          <NavLink key={path} to={`/dashboard/${path}`} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] ${isActive ? 'bg-primary/20 text-foreground' : 'text-muted-foreground'}`}>
            <Icon className="h-4 w-4" />{label}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default function Dashboard() {
  const { user } = useStore();
  return (
    <div className="dash-bg min-h-screen">
      <Sidebar />
      <MobileNav />
      <main className="min-h-screen px-4 pb-24 pt-24 md:py-8 md:pl-[19rem] md:pr-8">
        <Suspense fallback={<div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">Loading…</div>}><Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="editor" element={<Editor />} />
          <Route path="shop" element={<Shop />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="notifications/:threadId" element={<Conversation />} />
          <Route path="badges" element={<Badges />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="visitors" element={<VisitorAnalytics />} />
        </Routes></Suspense>
      </main>
    </div>
  );
}

