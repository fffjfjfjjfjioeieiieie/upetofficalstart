import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, LayoutDashboard, LogOut, Menu, Moon, Settings, Sun, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useStore } from '../lib/store';
import { Logo } from './Logo';
import { Avatar } from './ProfileBits';

const NAV_ITEMS = [['Features', '/#features'], ['Explore', '/explore']];

function AccountMenu() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const signOut = async () => { await logout(); navigate('/'); };
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><button type="button" aria-label="Open account menu" className="rounded-full ring-1 ring-primary/40 transition-colors hover:ring-primary"><Avatar media={user.profile.media.avatar} name={user.username} size={36} /></button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="glass w-56 rounded-2xl p-1.5">
      <DropdownMenuLabel><span className="block truncate text-sm">{user.profile.alias || user.username}</span><span className="block truncate text-xs font-normal text-muted-foreground">user.pet/{user.username}</span></DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => navigate('/dashboard')} className="rounded-xl"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate(`/${user.username}`)} className="rounded-xl"><ExternalLink className="mr-2 h-4 w-4" />View profile</DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="rounded-xl"><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={signOut} className="rounded-xl text-red-400 focus:text-red-400"><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function Header() {
  const { user, theme, toggleTheme } = useStore();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setOpen(false), [location.pathname, location.hash]);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return <header data-scrolled={scrolled} className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
    <div className="glass mx-auto flex h-16 w-full max-w-[76rem] items-center justify-between rounded-2xl px-3 shadow-[var(--upet-shadow-low)] sm:px-4">
      <Link to="/" aria-label="user.pet home"><Logo /></Link>
      <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">{NAV_ITEMS.map(([label, href]) => <Link key={label} to={href} className="rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{label}</Link>)}</nav>
      <div className="flex items-center gap-2">
        <button type="button" data-testid="theme-toggle" onClick={toggleTheme} aria-label={`Use ${theme === 'dark' ? 'light' : 'dark'} theme`} className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground">{theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
        {user ? <><Link to="/dashboard" className="hidden min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground sm:inline-flex">Go to dashboard</Link><AccountMenu /></> : <div className="flex items-center gap-2"><Link to="/login" data-testid="header-login-button" className="rounded-xl px-2 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground sm:px-3 sm:text-sm">Log in</Link><Link to="/login?mode=signup" className="hidden rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground sm:block">Sign up</Link></div>}
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-site-menu" aria-label="Toggle navigation" className="grid h-10 w-10 place-items-center rounded-xl text-foreground md:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
    </div>
    {open && <nav id="mobile-site-menu" aria-label="Mobile navigation" className="glass mx-auto mt-2 grid w-full max-w-[76rem] gap-1 rounded-2xl p-2 md:hidden">{NAV_ITEMS.map(([label, href]) => <Link key={label} to={href} className="rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-primary/10 hover:text-foreground">{label}</Link>)}{!user && <><Link to="/login" className="rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground">Log in</Link><Link to="/login?mode=signup" className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">Sign up</Link></>}{user && <Link to="/dashboard" className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">Go to dashboard</Link>}</nav>}
  </header>;
}
