import React from 'react';
import styles from './PublicProfile.module.css';
export default function ProfileSafetyGate({ profile, acknowledged, onContinue, onLeave }) {
  if (acknowledged || (!profile.contentWarning && !profile.ageGate)) return null;
  return <div className={styles.safetyGate} role="dialog" aria-modal="true" aria-label="Profile content notice"><div><span>USER.PET / CONTENT NOTICE</span><h2>{profile.ageGate ? 'Adults only' : 'Before you enter'}</h2><p>{profile.contentWarning || 'This profile is marked for adults.'}</p>{profile.ageGate && <small>By continuing, you confirm that you are at least 18.</small>}<div><button type="button" onClick={onLeave}>Go back</button><button type="button" onClick={onContinue}>Continue</button></div></div></div>;
}
