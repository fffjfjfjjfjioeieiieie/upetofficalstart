import React from 'react';
import styles from './ProfileBanner.module.css';

export default function ProfileBanner({ onReady }) {
  return (
    <div className={styles.banner} aria-hidden="true">
      <img src="/lamp-pfp-banner.png" alt="" onLoad={onReady} onError={onReady} />
    </div>
  );
}
