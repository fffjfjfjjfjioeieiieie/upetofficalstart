import React from 'react';
import styles from './PublicProfile.module.css';
const ParticleLayer = React.lazy(() => import('./ParticleLayer.jsx'));

export default function ProfileBackground({ profile, videoRef, reduceMotion, entered }) {
  return <>
    {profile.backgroundUrl && (profile.backgroundType === 'video'
      ? <video ref={videoRef} className={styles.background} src={profile.backgroundUrl} autoPlay={!reduceMotion && entered} loop muted playsInline />
      : <img className={styles.background} src={profile.backgroundUrl} alt="" />)}
    <div className={styles.mediaOverlay} style={{ backgroundColor: profile.backgroundOverlay || '#05070b', opacity: (profile.backgroundOverlayOpacity ?? 60) / 100 }} />
    <div className={styles.scrim} />
    <div className={styles.ambient} aria-hidden="true"><i /><i /><i /></div>
    {profile.backgroundEffect === 'particles' && !reduceMotion && !window.matchMedia('(pointer: coarse)').matches && <React.Suspense fallback={null}><ParticleLayer color={profile.accentColor} intensity={profile.effectIntensity ?? 50} /></React.Suspense>}
    {profile.overlayEffect !== 'none' && <div className={styles.foregroundOverlay} data-effect={profile.overlayEffect} aria-hidden="true" />}
  </>;
}
