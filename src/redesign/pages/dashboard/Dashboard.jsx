import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Suspense, useState } from 'react';
import { LayoutGrid, PenTool, Award, Trophy, Settings as Cog, LogOut, ExternalLink, ChartNoAxesCombined, Menu, ShieldCheck, X, GalleryVerticalEnd, HandHeart } from "lucide-react";
import { useStore } from "../../lib/store";
import { useHelpAuth } from '../../../help/context/HelpAuth.jsx';
import { Logo } from "../../components/Logo";
import { Avatar } from "../../components/ProfileBits";
import { lazyWithRetry } from '../../lib/lazyWithRetry';
import { RouteLoading } from '../../components/RouteState';
const Overview = lazyWithRetry(() => import('./Overview'), 'dashboard-overview');
const Editor = lazyWithRetry(() => import('./Editor'), 'dashboard-editor');
const Donations = lazyWithRetry(() => import('./Donations'), 'dashboard-donations');
const Badges = lazyWithRetry(() => import('./Badges'), 'dashboard-badges');
const Leaderboard = lazyWithRetry(() => import('./Leaderboard'), 'dashboard-leaderboard');
const Settings = lazyWithRetry(() => import('./Settings'), 'dashboard-settings');
const VisitorAnalytics = lazyWithRetry(() => import('./VisitorAnalytics'), 'dashboard-visitors');
const Modview = lazyWithRetry(() => import('./Modview'), 'dashboard-modview');
const Presets = lazyWithRetry(() => import('./Presets'), 'dashboard-profiles');

const DASHBOARD_PAGES = { overview: Overview, editor: Editor, donations: Donations, profiles: Presets, badges: Badges, leaderboard: Leaderboard, settings: Settings, visitors: VisitorAnalytics, modview: Modview };
const warm = (path) => DASHBOARD_PAGES[path]?.preload?.().catch(() => {});

const NAV = [
  ["overview", "Overview", LayoutGrid],
  ["editor", "Editor", PenTool],
  ["donations", "Donations", HandHeart],
  ["profiles", "Profiles", GalleryVerticalEnd],
  ["badges", "Badges", Award],
  ["leaderboard", "Leaderboard", Trophy],
  ["settings", "Settings", Cog],
  ["visitors", "Visitors", ChartNoAxesCombined],
];

const Sidebar = () => {
  const { user, logout } = useStore();
  const { staff } = useHelpAuth();
  const nav = useNavigate();
  const out = () => { logout(); nav("/"); };
  return (
    <aside data-testid="dashboard-sidebar" className="glass fixed bottom-4 left-4 top-4 z-40 hidden w-64 flex-col rounded-[1.5rem] p-4 md:flex">
      <NavLink to="/" className="px-2 py-1" data-testid="sidebar-logo"><Logo /></NavLink>
      <nav className="mt-8 flex-1 space-y-1">
        {NAV.filter(([path]) => path !== 'visitors' || user.role === 'founder').map(([path, label, Icon]) => (
          <NavLink key={path} to={`/dashboard/${path}`} onMouseEnter={() => warm(path)} onFocus={() => warm(path)} data-testid={`sidebar-${path}`} className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"}`}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute bottom-2 left-0 top-2 w-1 rounded-full bg-primary" />}
                <Icon className="h-4 w-4" />{label}
              </>
            )}
          </NavLink>
        ))}
        {staff?.active && <NavLink to="/dashboard/modview" onMouseEnter={() => warm('modview')} onFocus={() => warm('modview')} data-testid="sidebar-modview" className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"}`}><ShieldCheck className="h-4 w-4" />Modview</NavLink>}
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
  const { user, saveState, logout } = useStore();
  const { staff } = useHelpAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const close = () => setOpen(false);
  const out = () => { close(); logout(); nav('/'); };
  const links = NAV.filter(([path]) => path !== 'visitors' || user.role === 'founder');
  return (
    <>
      <header className="glass fixed inset-x-3 top-[max(.75rem,env(safe-area-inset-top))] z-40 flex h-14 items-center justify-between rounded-2xl px-4 md:hidden">
        <NavLink to="/"><Logo /></NavLink>
        <div className="flex min-w-0 items-center gap-2"><span className="max-w-28 truncate text-xs text-muted-foreground">{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : `@${user.username}`}</span><button type="button" onClick={() => setOpen((value) => !value)} aria-label="Open dashboard menu" aria-expanded={open} className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button></div>
      </header>
      {open && <div className="fixed inset-0 z-[39] bg-black/60 px-3 pb-24 pt-20 backdrop-blur-sm md:hidden" onClick={close}><nav className="glass max-h-full overflow-y-auto rounded-2xl p-2" onClick={(event) => event.stopPropagation()}>
        {links.map(([path, label, Icon]) => <NavLink key={path} to={`/dashboard/${path}`} onPointerDown={() => warm(path)} onClick={close} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${isActive ? 'bg-primary/20 text-foreground' : 'text-muted-foreground'}`}><Icon className="h-4 w-4" />{label}</NavLink>)}
        {staff?.active && <NavLink to="/dashboard/modview" onClick={close} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${isActive ? 'bg-primary/20 text-foreground' : 'text-muted-foreground'}`}><ShieldCheck className="h-4 w-4" />Modview</NavLink>}
        <div className="my-2 border-t" />
        <button type="button" onClick={() => { close(); nav(`/${user.username}`); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground"><ExternalLink className="h-4 w-4" />View my page</button>
        <button type="button" onClick={out} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400"><LogOut className="h-4 w-4" />Logout</button>
      </nav></div>}
      <nav className="glass fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-4 rounded-2xl p-1.5 md:hidden">
        {NAV.filter(([path]) => ['overview', 'editor'].includes(path)).map(([path, label, Icon]) => (
          <NavLink key={path} to={`/dashboard/${path}`} onPointerDown={() => warm(path)} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] ${isActive ? 'bg-primary/20 text-foreground' : 'text-muted-foreground'}`}>
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
      <main className="min-h-screen overflow-x-hidden px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(6rem+env(safe-area-inset-top))] sm:px-4 md:py-8 md:pl-[19rem] md:pr-8">
        <Suspense fallback={<RouteLoading label="Opening this section…" />}><Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="editor" element={<Editor />} />
          <Route path="donations" element={<Donations />} />
          <Route path="shop" element={<Navigate to="/dashboard/editor" replace />} />
          <Route path="premium" element={<Navigate to="/dashboard/editor" replace />} />
          <Route path="notifications/*" element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="profiles" element={<Presets />} />
          <Route path="badges" element={<Badges />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="visitors" element={<VisitorAnalytics />} />
          <Route path="modview/*" element={<Modview />} />
        </Routes></Suspense>
      </main>
    </div>
  );
}

