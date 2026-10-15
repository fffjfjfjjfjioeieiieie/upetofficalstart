import React, { useEffect, useState } from 'react';
import DashboardShell from './DashboardShell.jsx';
import DashboardOverview from './DashboardOverview.jsx';
import DashboardAnalytics from './DashboardAnalytics.jsx';
import DashboardSettings from './DashboardSettings.jsx';
import { getEditableProfile, getProfileStatus } from '../data/profileStore.js';
import { getProfileAnalytics } from '../data/analyticsStore.js';

export default function Dashboard({ username, user, onLogout, onNavigate, theme, onToggleTheme, activePage = 'dashboard' }) {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    if (!user?.uid || !username) return undefined;
    Promise.allSettled([
      getEditableProfile(user, username),
      getProfileStatus(user, username),
      getProfileAnalytics(username),
    ]).then(([profileResult, statusResult, analyticsResult]) => {
      if (!current) return;
      if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
      if (statusResult.status === 'fulfilled') setStatus(statusResult.value);
      if (analyticsResult.status === 'fulfilled') setAnalytics(analyticsResult.value);
      if ([profileResult, statusResult, analyticsResult].some((result) => result.status === 'rejected')) setError('Some account data could not load. Check your connection and deployed Firestore rules.');
    });
    return () => { current = false; };
  }, [user, username]);

  return <DashboardShell username={username} title={activePage === 'dashboard' ? 'Overview' : activePage === 'analytics' ? 'Analytics' : 'Settings'} activePath={`/${activePage}`} theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} onLogout={onLogout}>
    {error && <p role="status">{error}</p>}
    {activePage === 'analytics' ? <DashboardAnalytics analytics={analytics} error={error} />
      : activePage === 'settings' ? <DashboardSettings user={user} username={username} onLogout={onLogout} />
        : <DashboardOverview username={username} profile={profile} status={status} analytics={analytics} onNavigate={onNavigate} />}
  </DashboardShell>;
}
