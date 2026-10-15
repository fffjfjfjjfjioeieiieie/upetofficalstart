import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BadgeCheck, ExternalLink, MapPin, Music2, Pause, Play, Sparkles, Volume2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { PROFILE_FONTS } from '../shared/profileDefaults.js';
import styles from './PublicProfile.module.css';

export default function PublicProfile({ profile, owner = false, onNavigate }) {
  const [entered, setEntered] = useState(!profile.showEnterScreen);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(72);
  const [displayBio, setDisplayBio] = useState(profile.bio || '');
  const [cursorPoint, setCursorPoint] = useState({ x: -100, y: -100 });
  const audioRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const previous = document.title;
    const titles = [`${profile.displayName} (@${profile.username}) | user.pet`, `✦ user.pet/${profile.username}`];
    document.title = titles[0];
    let timer;
    if (profile.animatedTitle && !reduceMotion) {
      let index = 0;
      timer = window.setInterval(() => { index = (index + 1) % titles.length; document.title = titles[index]; }, 1100);
    }
    return () => { window.clearInterval(timer); document.title = previous; };
  }, [profile.displayName, profile.username, profile.animatedTitle, reduceMotion]);

  useEffect(() => {
    if (profile.bioEffect !== 'typewriter' || reduceMotion || !entered) {
      setDisplayBio(profile.bio || '');
      return undefined;
    }
    setDisplayBio('');
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayBio((profile.bio || '').slice(0, index));
      if (index >= (profile.bio || '').length) window.clearInterval(timer);
    }, 34);
    return () => window.clearInterval(timer);
  }, [profile.bio, profile.bioEffect, reduceMotion, entered]);

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
    '--profile-secondary': profile.secondaryColor || profile.accentColor,
    '--profile-width': `${profile.cardWidth || 480}px`,
    '--profile-tilt-x': `${tilt.x}deg`,
    '--profile-tilt-y': `${tilt.y}deg`,
  };

  const moveCard = (event) => {
    if (!profile.enableTilt || reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -6,
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 8,
    });
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
    <div className={styles.page} style={pageStyle} data-effect={profile.backgroundEffect} data-grain={profile.enableGrain} data-animated-accent={profile.animatedAccent} data-custom-cursor={profile.customCursor && Boolean(profile.cursorUrl)} onPointerMove={(event) => setCursorPoint({ x: event.clientX, y: event.clientY })}>
      {profile.backgroundUrl && (profile.backgroundType === 'video'
        ? <video className={styles.background} src={profile.backgroundUrl} autoPlay loop muted playsInline />
        : <img className={styles.background} src={profile.backgroundUrl} alt="" />)}
      <div className={styles.scrim} />
      <div className={styles.ambient} aria-hidden="true"><i /><i /><i /></div>
      {profile.customCursor && profile.cursorUrl && <img className={styles.customCursor} src={profile.cursorUrl} alt="" aria-hidden="true" style={{ transform: `translate3d(${cursorPoint.x}px, ${cursorPoint.y}px, 0)` }} />}
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
          data-layout={profile.layout || 'centered'}
          data-avatar-shape={profile.avatarShape || 'circle'}
          onPointerMove={moveCard}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
          initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: tilt.x, rotateY: tilt.y }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          {profile.showBanner && profile.bannerUrl && <img className={styles.banner} src={profile.bannerUrl} alt="" />}
          <div className={styles.identity}>
            {profile.avatarUrl ? <img className={styles.avatar} src={profile.avatarUrl} alt={`${profile.displayName}'s avatar`} style={{ objectPosition: `${profile.avatarCropX ?? 50}% ${profile.avatarCropY ?? 50}%`, transform: `scale(${(profile.avatarZoom ?? 100) / 100})` }} /> : <div className={styles.avatarFallback}>{profile.displayName.slice(0, 1).toUpperCase()}</div>}
            <div className={styles.identityCopy}>
              <h1 data-effect={profile.usernameEffect}>{profile.displayName}</h1>
              <p className={styles.handle}>@{profile.username}</p>
              {profile.showStatus && profile.statusText && <p className={styles.status}><i />{profile.statusText}</p>}
            </div>
          </div>
          {(profile.badges || []).length > 0 && <div className={styles.badges}>{profile.badges.slice(0, 6).map((badge) => <span key={badge}><BadgeCheck size={12} />{badge}</span>)}</div>}
          <p className={styles.bio} data-effect={profile.bioEffect}>{displayBio}{profile.bioEffect === 'typewriter' && <i aria-hidden="true" />}</p>
          {profile.location && profile.showLocation && <p className={styles.location}><MapPin size={13} />{profile.location}</p>}
          {safeLinks.length > 0 && <nav className={styles.links} aria-label="Profile links">{safeLinks.map((link, index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer"><span><Sparkles size={13} />{link.label}</span><ExternalLink size={14} /></a>)}</nav>}
          {profile.audioUrl && <div className={styles.player}>
            <button type="button" onClick={toggleAudio} aria-label={playing ? 'Pause music' : 'Play music'}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
            <Music2 size={16} />
            <span><strong>{profile.trackTitle || 'Profile audio'}</strong><small>{profile.trackArtist || profile.displayName}</small></span>
            {profile.showVisualizer ? <span className={styles.visualizer} data-playing={playing} aria-label={playing ? 'Audio visualizer playing' : 'Audio visualizer paused'}>{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</span> : <Volume2 size={15} />}
          </div>}
          <audio ref={audioRef} src={profile.audioUrl} loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
          {profile.audioUrl && profile.showVolumeControl && <label className={styles.volume}><Volume2 size={13} /><input type="range" min="0" max="100" value={volume} aria-label="Profile music volume" onChange={(event) => { const next = Number(event.target.value); setVolume(next); if (audioRef.current) audioRef.current.volume = next / 100; }} /><span>{volume}%</span></label>}
        </motion.article>
      </main>
      <footer className={styles.footer}><button type="button" onClick={() => onNavigate('/')}><ArrowLeft size={12} /> user<span>.pet</span></button></footer>
    </div>
  );
}

