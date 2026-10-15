import React from 'react';
import { BarChart3, LayoutDashboard, LogOut, Moon, Palette, Settings, Sun } from 'lucide-react';
import styles from './DashboardShell.module.css';

export const dashboardDestinations = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Customize', path: '/customize', icon: Palette },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function DashboardNav({ activePath, username, theme, onNavigate, onToggleTheme, onLogout }) {
  return <>
    <aside className={styles.rail}>
      <button className={styles.logo} type="button" onClick={() => onNavigate('/')} aria-label="user.pet home"><img src={theme === 'light' ? '/upetlogoleftlightmode.png' : '/upetlogoleft.png'} alt="user.pet" /></button>
      <div className={styles.account}><span className={styles.accountAvatar}>{username?.slice(0, 1).toUpperCase()}</span><span><strong>@{username}</strong><small>Founder workspace</small></span></div>
      <nav aria-label="Workspace" className={styles.railLinks}>
        <span className={styles.railLabel}>Profile</span>
        {dashboardDestinations.slice(0, 2).map(({ label, path, icon: Icon }) => <button key={path} type="button" className={activePath === path ? styles.active : ''} aria-current={activePath === path ? 'page' : undefined} onClick={() => onNavigate(path)}><Icon size={17} /><span>{label}</span></button>)}
        <span className={styles.railLabel}>Manage</span>
        {dashboardDestinations.slice(2).map(({ label, path, icon: Icon }) => <button key={path} type="button" className={activePath === path ? styles.active : ''} aria-current={activePath === path ? 'page' : undefined} onClick={() => onNavigate(path)}><Icon size={17} /><span>{label}</span></button>)}
      </nav>
      <div className={styles.railFoot}><button type="button" onClick={onToggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}<span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span></button><button type="button" onClick={onLogout}><LogOut size={16} /><span>Log out</span></button></div>
    </aside>
    <nav className={styles.mobileNav} aria-label="Workspace mobile navigation">{dashboardDestinations.map(({ label, path, icon: Icon }) => <button key={path} type="button" className={activePath === path ? styles.active : ''} aria-current={activePath === path ? 'page' : undefined} onClick={() => onNavigate(path)}><Icon size={19} /><span>{label}</span></button>)}</nav>
  </>;
}
