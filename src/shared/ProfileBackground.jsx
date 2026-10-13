import React from 'react';
import styles from './ProfileBackground.module.css';

export default function ProfileBackground({ src = '/profile-background.mp4', poster = '/lamp-banner.jpg', onReady }) {
  return (
    <div className={styles.background} aria-hidden="true">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={poster || undefined}
        onLoadedData={onReady}
        onError={onReady}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className={styles.shade} />
    </div>
  );
}
