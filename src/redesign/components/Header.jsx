import { Link, NavLink, useNavigate } from "react-router-dom";
import { User, Sun, Moon, LayoutDashboard, ExternalLink, Repeat, LogOut, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useStore } from "../lib/store";
import { Logo } from "./Logo";
import { Avatar } from "./ProfileBits";
import { SiteNavShell } from "./SitePrimitives";

const TABS = [["Explore", "/explore"]];

const AccountMenu = () => {
  const { user, session, db, logout, switchTo } = useStore();
  const nav = useNavigate();
  const others = session.accounts.filter((a) => a !== user.username && db.users[a]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button data-testid="header-account-button" className="rounded-full ring-2 ring-primary/40 transition-transform hover:scale-105">
          <Avatar media={user.profile.media.avatar} name={user.username} size={34} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl glass p-1.5">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-semibold">{user.profile.alias}</div>
          <div className="text-xs text-muted-foreground">user.pet/{user.username}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem data-testid="menu-dashboard" onClick={() => nav("/dashboard")} className="rounded-xl"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</DropdownMenuItem>
        <DropdownMenuItem data-testid="menu-go-to-page" onClick={() => nav(`/${user.username}`)} className="rounded-xl"><ExternalLink className="mr-2 h-4 w-4" />Go to page</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Switch account</DropdownMenuLabel>
        <DropdownMenuItem className="rounded-xl" disabled><Check className="mr-2 h-4 w-4 text-primary" />{user.username}</DropdownMenuItem>
        {others.map((a) => (
          <DropdownMenuItem key={a} data-testid={`menu-switch-${a}`} onClick={() => switchTo(a)} className="rounded-xl"><Repeat className="mr-2 h-4 w-4" />{a}</DropdownMenuItem>
        ))}
        <DropdownMenuItem data-testid="menu-add-account" onClick={() => nav("/login?add=1")} className="rounded-xl"><User className="mr-2 h-4 w-4" />Add another account</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem data-testid="menu-logout" onClick={() => { logout(); nav("/"); }} className="rounded-xl text-red-500 focus:text-red-500"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Header = () => {
  const { user, theme, toggleTheme } = useStore();
  return (
    <header className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
      <SiteNavShell data-testid="header-pill">
        <Link to="/" data-testid="header-logo"><Logo /></Link>
        <div className="hidden items-center gap-1 sm:flex">
          {TABS.map(([label, to]) => (
            <NavLink key={to} to={to} data-testid={`nav-${label.toLowerCase()}`} className={({ isActive }) => `rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 ${isActive ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"}`}>
              {label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {user ? <AccountMenu /> : (
            <Link to="/login" data-testid="header-login-button" className="flex h-9 items-center gap-2 rounded-full bg-primary/15 px-3 text-xs font-semibold transition-colors hover:bg-primary/30"><User className="h-4 w-4" />Log in</Link>
          )}
          <button data-testid="theme-toggle" onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-primary/15" aria-label="Toggle theme">
            <span key={theme}>
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </span>
          </button>
        </div>
      </SiteNavShell>
    </header>
  );
};
