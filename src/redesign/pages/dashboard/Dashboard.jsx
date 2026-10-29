import { Suspense, useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, ChevronLeft, ChevronRight, ExternalLink, HandCoins, LayoutDashboard, LogOut, Menu, PenTool, Settings as SettingsIcon, ShieldCheck, UserRound, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { useStore } from '../../lib/store';
import { useHelpAuth } from '../../../help/context/HelpAuth.jsx';
import { Logo } from '../../components/Logo';
import { Avatar } from '../../components/ProfileBits';
import { lazyWithRetry } from '../../lib/lazyWithRetry';
import { RouteLoading } from '../../components/RouteState';

const Overview = lazyWithRetry(() => import('./Overview'), 'dashboard-overview');
const Editor = lazyWithRetry(() => import('./Editor'), 'dashboard-editor');
const Settings = lazyWithRetry(() => import('./Settings'), 'dashboard-settings');
const VisitorAnalytics = lazyWithRetry(() => import('./VisitorAnalytics'), 'dashboard-visitors');
const Modview = lazyWithRetry(() => import('./Modview'), 'dashboard-modview');
const Badges = lazyWithRetry(() => import('./Badges'), 'dashboard-badges');
const Leaderboard = lazyWithRetry(() => import('./Leaderboard'), 'dashboard-leaderboard');
const Presets = lazyWithRetry(() => import('./Presets'), 'dashboard-profiles');

const PAGE_LOADERS = { overview: Overview, editor: Editor, settings: Settings, visitors: VisitorAnalytics, modview: Modview };
const warm = (path) => PAGE_LOADERS[path]?.preload?.().catch(() => {});
const CORE_NAV = [
  ['overview', 'Overview', LayoutDashboard],
  ['editor', 'Editor', PenTool],
  ['donations', 'Donations', HandCoins],
  ['visitors', 'Analytics', BarChart3],
  ['settings', 'Settings', SettingsIcon],
];

function navFor(user) {
  return CORE_NAV.filter(([path]) => path !== 'visitors' || user.role === 'founder');
}

function AccountMenu() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const out = async () => { await logout(); navigate('/'); };
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><button type="button" aria-label="Open account menu" className="rounded-full ring-1 ring-primary/35 transition-colors hover:ring-primary"><Avatar media={user.profile.media.avatar} name={user.username} size={38} /></button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="glass w-56 rounded-2xl p-1.5">
      <DropdownMenuLabel><span className="block truncate text-sm">{user.profile.alias || user.username}</span><span className="block truncate text-xs font-normal text-muted-foreground">@{user.username}</span></DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => navigate(`/${user.username}`)} className="rounded-xl"><UserRound className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="rounded-xl"><SettingsIcon className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={out} className="rounded-xl text-red-400 focus:text-red-400"><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

function Sidebar({ collapsed, onCollapse }) {
  const { user } = useStore();
  const { staff } = useHelpAuth();
  const links = navFor(user);
  return <aside className={`glass fixed bottom-4 left-4 top-4 z-40 hidden flex-col rounded-3xl p-3 transition-[width] duration-200 md:flex ${collapsed ? 'w-[4.75rem]' : 'w-64'}`} aria-label="Dashboard navigation">
    <div className={`flex h-12 items-center ${collapsed ? 'justify-center' : 'justify-between px-1'}`}><NavLink to="/" aria-label="user.pet home"><Logo compact={collapsed} /></NavLink>{!collapsed && <button type="button" onClick={onCollapse} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-foreground" aria-label="Collapse sidebar"><ChevronLeft className="h-4 w-4" /></button>}</div>
    {collapsed && <button type="button" onClick={onCollapse} className="mx-auto mt-2 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-foreground" aria-label="Expand sidebar"><ChevronRight className="h-4 w-4" /></button>}
    <nav className="mt-7 flex-1 space-y-1">{links.map(([path, label, Icon]) => <NavLink key={path} to={`/dashboard/${path}`} onMouseEnter={() => warm(path)} onFocus={() => warm(path)} title={collapsed ? label : undefined} className={({ isActive }) => `relative flex min-h-11 items-center rounded-xl text-sm font-semibold transition-colors ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-primary/[.08] hover:text-foreground'}`}>{({ isActive }) => <>{isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />}<Icon className="h-[1.1rem] w-[1.1rem] shrink-0" />{!collapsed && label}</>}</NavLink>)}{staff?.active && <NavLink to="/dashboard/modview" title={collapsed ? 'Modview' : undefined} className={({ isActive }) => `relative flex min-h-11 items-center rounded-xl text-sm font-semibold ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-primary/[.08]'}`}><ShieldCheck className="h-[1.1rem] w-[1.1rem]" />{!collapsed && 'Modview'}</NavLink>}</nav>
    <NavLink to={`/${user.username}`} title={collapsed ? 'View profile' : undefined} className={`flex min-h-11 items-center rounded-xl text-sm font-semibold text-muted-foreground hover:bg-primary/[.08] hover:text-foreground ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}><ExternalLink className="h-[1.1rem] w-[1.1rem]" />{!collapsed && 'View profile'}</NavLink>
  </aside>;
}

function MobileNavigation() {
  const { user } = useStore();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  const links = navFor(user);
  const primary = links.filter(([path]) => ['overview', 'editor', 'donations', 'settings'].includes(path));
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Open all dashboard sections" className="fixed right-16 top-[max(1rem,env(safe-area-inset-top))] z-50 grid h-10 w-10 place-items-center rounded-xl border border-border bg-card/80 text-muted-foreground backdrop-blur md:hidden"><Menu className="h-4 w-4" /></button>
    {open && <div className="fixed inset-0 z-[60] bg-background/88 p-3 backdrop-blur-xl md:hidden"><div className="mx-auto flex h-full max-w-md flex-col"><div className="flex items-center justify-between px-2 py-3"><Logo /><button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10"><X className="h-5 w-5" /></button></div><nav className="mt-5 grid gap-2">{links.map(([path, label, Icon]) => <NavLink key={path} to={`/dashboard/${path}`} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-4 font-semibold ${isActive ? 'bg-primary/15 text-foreground' : 'text-muted-foreground'}`}><Icon className="h-5 w-5" />{label}</NavLink>)}</nav></div></div>}
    <nav className="glass fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-50 grid grid-cols-4 rounded-2xl p-1.5 md:hidden" aria-label="Primary dashboard sections">{primary.map(([path, label, Icon]) => <NavLink key={path} to={`/dashboard/${path}`} className={({ isActive }) => `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold ${isActive ? 'bg-primary/15 text-foreground' : 'text-muted-foreground'}`}><Icon className="h-4 w-4" /><span className="truncate">{label}</span></NavLink>)}</nav>
  </>;
}

function DonationPlaceholder() {
  return <section className="grid min-h-[55vh] place-items-center"><div className="glass max-w-lg rounded-3xl p-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><HandCoins className="h-5 w-5" /></span><h1 className="mt-5 font-display text-2xl font-bold">Donations</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">The Donations workspace is being prepared separately. This shell already links to its final route without changing payment code.</p></div></section>;
}

export default function Dashboard() {
  const { user, saveState } = useStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('upet-dashboard-collapsed') === 'yes');
  const section = location.pathname.split('/')[2] || 'overview';
  const label = navFor(user).find(([path]) => path === section)?.[1] || 'Workspace';
  const toggleCollapsed = () => setCollapsed((value) => { localStorage.setItem('upet-dashboard-collapsed', value ? 'no' : 'yes'); return !value; });

  return <div className="dash-bg min-h-screen">
    <Sidebar collapsed={collapsed} onCollapse={toggleCollapsed} />
    <MobileNavigation />
    <header className={`fixed right-3 top-[max(.75rem,env(safe-area-inset-top))] z-40 flex h-14 items-center gap-3 rounded-2xl border border-border bg-card/[.78] px-3 backdrop-blur-xl transition-[left] md:right-6 md:top-4 ${collapsed ? 'md:left-[6.25rem]' : 'md:left-[18rem]'}`}><div className="min-w-0 flex-1"><p className="truncate text-xs text-muted-foreground">user.pet workspace</p><p className="truncate text-sm font-bold">{label}</p></div><span className="hidden text-xs text-muted-foreground sm:block">{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'All changes saved'}</span><AccountMenu /></header>
    <main className={`min-h-screen overflow-x-hidden px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(6rem+env(safe-area-inset-top))] transition-[padding] sm:px-5 md:pb-10 md:pr-7 md:pt-24 ${collapsed ? 'md:pl-[6.75rem]' : 'md:pl-[18.5rem]'}`}>
      <Suspense fallback={<RouteLoading label="Opening this section…" />}><Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="editor" element={<Editor />} />
        <Route path="donations" element={<DonationPlaceholder />} />
        <Route path="settings" element={<Settings />} />
        <Route path="visitors" element={user.role === 'founder' ? <VisitorAnalytics /> : <Navigate to="/dashboard/overview" replace />} />
        <Route path="profiles" element={<Presets />} />
        <Route path="badges" element={<Badges />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="modview/*" element={<Modview />} />
        <Route path="shop" element={<Navigate to="/dashboard/editor" replace />} />
        <Route path="premium" element={<Navigate to="/dashboard/editor" replace />} />
        <Route path="notifications/*" element={<Navigate to="/dashboard/overview" replace />} />
        <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
      </Routes></Suspense>
    </main>
  </div>;
}
