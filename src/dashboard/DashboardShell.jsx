import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import DashboardNav from './DashboardNav.jsx';
import styles from './DashboardShell.module.css';

export default function DashboardShell({ username, title, activePath, theme, onNavigate, onToggleTheme, onLogout, children }) {
  return <div className={styles.shell} data-theme={theme}>
    <DashboardNav activePath={activePath} username={username} theme={theme} onNavigate={onNavigate} onToggleTheme={onToggleTheme} onLogout={onLogout} />
    <header className={styles.topbar}><div><span>user.pet / workspace</span><h1>{title}</h1></div><button type="button" onClick={() => onNavigate(`/${username}`)}>View profile <ArrowUpRight size={15} /></button></header>
    <main className={styles.main}>{children}</main>
  </div>;
}
