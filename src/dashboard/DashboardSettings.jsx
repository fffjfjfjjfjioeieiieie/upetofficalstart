import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../app/firebase.js';
import { resetProfileDraft } from '../data/profileStore.js';
import styles from './DashboardOverview.module.css';

export default function DashboardSettings({ user, username, onLogout }) {
  const [message, setMessage] = useState('');
  const resetPassword = async () => {
    try { await sendPasswordResetEmail(auth, user.email); setMessage('Password reset email sent.'); }
    catch { setMessage('Could not send the reset email. Try again shortly.'); }
  };
  const resetDraft = async () => {
    if (!window.confirm('Reset your unpublished draft? Your live profile stays online. This cannot be undone.')) return;
    try { await resetProfileDraft(user); setMessage('Unpublished draft reset. Reopen the studio to start from your published profile.'); }
    catch { setMessage('Could not reset the draft. Check your connection and rules.'); }
  };
  return <div className={styles.overview}><div className={styles.intro}><div><span>ACCOUNT</span><h2>Settings</h2><p>Manage the founder account connected to your profile.</p></div></div><section className={styles.panel}><div className={styles.panelHead}><span>Account identity</span></div><div className={styles.dataRow}><span>Email</span><strong>{user.email}</strong></div><div className={styles.dataRow}><span>Profile URL</span><strong>user.pet/{username}</strong></div><p className={styles.helper}>Usernames are fixed after claiming so shared links keep working.</p></section><section className={styles.panel}><div className={styles.panelHead}><span>Security</span></div><div className={styles.settingActions}><button type="button" onClick={resetPassword}>Send password reset email</button><button type="button" onClick={onLogout}>Log out</button></div>{message && <p className={styles.helper} role="status">{message}</p>}</section><section className={styles.panel}><div className={styles.panelHead}><span>Draft controls</span></div><p className={styles.helper}>Reset unpublished edits and reopen the studio from your live page.</p><div className={styles.settingActions}><button type="button" onClick={resetDraft}>Reset draft</button></div></section></div>;
}
