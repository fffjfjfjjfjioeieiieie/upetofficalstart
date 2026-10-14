import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, MapPin, Music2, Pause, Play, Volume2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { PROFILE_FONTS } from '../shared/profileDefaults.js';
import styles from './PublicProfile.module.css';

export default function PublicProfile({ profile, owner = false, onNavigate }) {
  const [entered, setEntered] = useState(!profile.showEnterScreen);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const previous = document.title;
    document.title = `${profile.displayName} (@${profile.username}) | user.pet`;
    return () => { document.title = previous; };
  }, [profile.displayName, profile.username]);

  const enter = async () => {
    setEntered(true);
    if (profile.audioUrl && audioRef.current) {
      try { await audioRef.current.play(); } catch { /* A play button remains available. */ }
    }
  };

  const toggleAudio = async () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      try { await audioRef.current.play(); } catch { setPlaying(false); }
    } else audioRef.current.pause();
  };

  const pageStyle = {
    '--profile-accent': profile.accentColor,
    '--profile-text': profile.textColor,
    '--profile-surface': profile.surfaceColor,
    '--profile-opacity': profile.surfaceOpacity / 100,
    '--profile-blur': `${profile.surfaceBlur}px`,
    '--profile-radius': `${profile.borderRadius}px`,
    '--profile-font': PROFILE_FONTS[profile.font] || PROFILE_FONTS.space,
    '--profile-visualizer': profile.visualizerColor || profile.accentColor,
  };

  const safeLinks = (profile.links || []).filter((link) => {
    try {
      const url = new URL(link.url);
      return link.label.trim() && ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  });

  return (
    <div className={styles.page} style={pageStyle} data-effect={profile.backgroundEffect}>
      {profile.backgroundUrl && (profile.backgroundType === 'video'
        ? <video className={styles.background} src={profile.backgroundUrl} autoPlay loop muted playsInline />
        : <img className={styles.background} src={profile.backgroundUrl} alt="" />)}
      <div className={styles.scrim} />
      {!entered && (
        <button className={styles.enterScreen} type="button" onClick={enter}>
          <span>{profile.enterText || 'click to enter'}</span>
          <small>user<span>.pet</span> / {profile.username}</small>
        </button>
      )}
      <header className={styles.header}>
        <a href="/" onClick={(event) => { event.preventDefault(); onNavigate('/'); }}><img src="/upetlogoleft.png" alt="user.pet" /></a>
        {owner && <button type="button" onClick={() => onNavigate('/customize')}>edit profile <ExternalLink size={13} /></button>}
      </header>
      <main className={styles.main}>
        <motion.article
          className={styles.card}
          initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          {profile.avatarUrl ? <img className={styles.avatar} src={profile.avatarUrl} alt={`${profile.displayName}'s avatar`} /> : <div className={styles.avatarFallback}>{profile.displayName.slice(0, 1).toUpperCase()}</div>}
          <h1 data-effect={profile.usernameEffect}>{profile.displayName}</h1>
          <p className={styles.handle}>@{profile.username}</p>
          <p className={styles.bio}>{profile.bio}</p>
          {profile.location && profile.showLocation && <p className={styles.location}><MapPin size={13} />{profile.location}</p>}
          {safeLinks.length > 0 && <nav className={styles.links} aria-label="Profile links">{safeLinks.map((link, index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer"><span>{link.label}</span><ExternalLink size={14} /></a>)}</nav>}
          {profile.audioUrl && <div className={styles.player}>
            <button type="button" onClick={toggleAudio} aria-label={playing ? 'Pause music' : 'Play music'}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
            <Music2 size={16} />
            <span><strong>{profile.trackTitle || 'Profile audio'}</strong><small>{profile.trackArtist || profile.displayName}</small></span>
            {profile.showVisualizer ? <span className={styles.visualizer} data-playing={playing} aria-label={playing ? 'Audio visualizer playing' : 'Audio visualizer paused'}>{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</span> : <Volume2 size={15} />}
          </div>}
          <audio ref={audioRef} src={profile.audioUrl} loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        </motion.article>
      </main>
      <footer className={styles.footer}><button type="button" onClick={() => onNavigate('/')}><ArrowLeft size={12} /> user<span>.pet</span></button></footer>
    </div>
  );
}

