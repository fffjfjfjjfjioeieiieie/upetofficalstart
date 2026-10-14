import React, { useEffect, useState } from 'react';
import { getPublicProfile } from '../data/profileStore.js';
import PublicProfile from './PublicProfile.jsx';
import styles from './PublicProfile.module.css';

export default function PublicProfileRoute({ username, currentUser, onNavigate }) {
  const [state, setState] = useState({ loading: true, profile: null, error: '' });

  useEffect(() => {
    let active = true;
    setState({ loading: true, profile: null, error: '' });
    getPublicProfile(username).then((profile) => {
      if (active) setState({ loading: false, profile, error: '' });
    }).catch(() => {
      if (active) setState({ loading: false, profile: null, error: 'This profile could not be loaded.' });
    });
    return () => { active = false; };
  }, [username]);

  if (state.loading) return <div className={styles.routeState}>loading user.pet/{username}…</div>;
  if (!state.profile) return <div className={styles.routeState}><strong>user.pet/{username}</strong><span>{state.error || 'This profile does not exist yet.'}</span><button type="button" onClick={() => onNavigate('/')}>back home</button></div>;
  return <PublicProfile profile={state.profile} owner={currentUser?.uid === state.profile.uid} onNavigate={onNavigate} />;
}
