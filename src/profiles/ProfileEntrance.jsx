import React from 'react';
import styles from './PublicProfile.module.css';

export default function ProfileEntrance({ profile, entered, entering, onEnter }) {
  if (entered || !profile.showEnterScreen) return null;
  return <button className={styles.enterScreen} data-exiting={entering} data-transition={profile.enterTransition || 'fade'} type="button" onClick={onEnter} disabled={entering}>
    <span>{profile.enterText || 'Enter profile'}</span>
    <small>{profile.enterSubtitle || <>user<span>.pet</span> / {profile.username}</>}</small>
    <em>{profile.enterButtonLabel || 'Enter'}</em>
  </button>;
}
