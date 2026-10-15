import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BadgeCheck, ExternalLink, MapPin, Music2, Pause, Play, Sparkles, Volume2 } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { PROFILE_FONTS } from '../shared/profileDefaults.js';
import ProfileBlocks from './blocks/ProfileBlocks.jsx';
import ProfileLayout from './layouts/ProfileLayout.jsx';
import ProfileBackground from './ProfileBackground.jsx';
import ProfileEntrance from './ProfileEntrance.jsx';
import ProfileSafetyGate from './ProfileSafetyGate.jsx';
import { recordProfileEvent } from '../data/analyticsStore.js';
import styles from './PublicProfile.module.css';

export default function PublicProfile({ profile, owner = false, onNavigate, preview = false, onCanvasBlockChange, mobilePreview = false }) {
  const [entered, setEntered] = useState(preview || !profile.showEnterScreen);
  const [entering, setEntering] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(preview || (!profile.contentWarning && !profile.ageGate));
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(profile.volume ?? 72);
  const [trackIndex, setTrackIndex] = useState(() => Math.max(0, (profile.audioTracks || []).findIndex((item) => item.id === profile.activeTrackId)));
  const [displayBio, setDisplayBio] = useState(profile.bio || '');
  const [displayNameText, setDisplayNameText] = useState(profile.displayName || '');
  const [cursorPoint, setCursorPoint] = useState({ x: -100, y: -100 });
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const pageRef = useRef(null);
  const clickAudioRef = useRef(null);
  const enterTimerRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  useEffect(() => () => window.clearTimeout(enterTimerRef.current), []);
  const tracks = profile.audioTracks?.length ? profile.audioTracks : profile.audioUrl ? [{ id: 'main', url: profile.audioUrl, title: profile.trackTitle, artist: profile.trackArtist }] : [];
  const activeTrack = tracks[trackIndex] || tracks[0];

  useEffect(() => { setTrackIndex(Math.max(0, tracks.findIndex((item) => item.id === profile.activeTrackId))); }, [profile.activeTrackId, profile.audioTracks?.length]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume]);
  useEffect(() => {
    if (!profile.clickSoundEnabled || !profile.clickSoundUrl || preview) { clickAudioRef.current = null; return undefined; }
    const audio = new Audio(profile.clickSoundUrl);
    audio.volume = (profile.clickSoundVolume ?? 35) / 100;
    clickAudioRef.current = audio;
    return () => { audio.pause(); clickAudioRef.current = null; };
  }, [profile.clickSoundEnabled, profile.clickSoundUrl, profile.clickSoundVolume, preview]);

  useEffect(() => {
    if (!preview) recordProfileEvent(profile.username, 'view');
  }, [profile.username, preview]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) { audioRef.current?.pause(); videoRef.current?.pause(); }
      else if (videoRef.current && entered && !reduceMotion) videoRef.current.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [entered, reduceMotion]);

  useEffect(() => {
    if (!pageRef.current || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) { audioRef.current?.pause(); videoRef.current?.pause(); }
      else if (videoRef.current && entered && !reduceMotion) videoRef.current.play().catch(() => {});
    }, { threshold: .01 });
    observer.observe(pageRef.current);
    return () => observer.disconnect();
  }, [entered, reduceMotion]);

  useEffect(() => {
    const previous = document.title;
    const titles = [`${profile.displayName} (@${profile.username}) | user.pet`, `✦ user.pet/${profile.username}`];
    if (preview) return undefined;
    document.title = profile.seoTitle || titles[0];
    const meta = document.querySelector('meta[name="description"]');
    const oldDescription = meta?.getAttribute('content');
    if (meta) meta.setAttribute('content', profile.seoDescription || profile.bio || 'A user.pet profile');
    let timer;
    if (profile.animatedTitle && !reduceMotion) {
      let index = 0;
      timer = window.setInterval(() => { index = (index + 1) % titles.length; document.title = titles[index]; }, 1100);
    }
    return () => { window.clearInterval(timer); document.title = previous; if (meta && oldDescription !== null) meta.setAttribute('content', oldDescription); };
  }, [profile.displayName, profile.username, profile.animatedTitle, profile.seoTitle, profile.seoDescription, profile.bio, reduceMotion, preview]);

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

  useEffect(() => {
    const name = profile.displayName || '';
    const effect = profile.usernameEffect;
    if (reduceMotion || profile.reducedMotionMode || !entered || !['typewriter', 'scramble'].includes(effect)) { setDisplayNameText(name); return undefined; }
    let step = 0;
    setDisplayNameText(effect === 'typewriter' ? '' : name);
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%';
    const timer = window.setInterval(() => {
      step += 1;
      if (effect === 'typewriter') setDisplayNameText(name.slice(0, step));
      else setDisplayNameText([...name].map((character, index) => index < step / 2 || character === ' ' ? character : glyphs[Math.floor(Math.random() * glyphs.length)]).join(''));
      if (step >= (effect === 'typewriter' ? name.length : name.length * 2)) { setDisplayNameText(name); window.clearInterval(timer); }
    }, effect === 'typewriter' ? 75 : 45);
    return () => window.clearInterval(timer);
  }, [profile.displayName, profile.usernameEffect, profile.reducedMotionMode, reduceMotion, entered]);

  const enter = () => {
    if (activeTrack?.url && audioRef.current) {
      audioRef.current.play().catch(() => { /* A play button remains available. */ });
    }
    if (reduceMotion || profile.reducedMotionMode) setEntered(true);
    else { setEntering(true); enterTimerRef.current = window.setTimeout(() => setEntered(true), 260); }
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
    '--profile-button-radius': `${profile.buttonRadius ?? 11}px`,
    '--profile-button-fill': profile.buttonBackground || '#162235',
    '--profile-button-text': profile.buttonText || profile.textColor || '#f7f8fc',
    '--profile-button-border': profile.buttonBorder || '#3d4f6c',
    '--profile-avatar-size': `${profile.avatarSize ?? 116}px`,
    '--profile-link-font': PROFILE_FONTS[profile.linkFont] || PROFILE_FONTS[profile.font] || PROFILE_FONTS.space,
    '--profile-background': profile.backgroundColor || '#080e1b',
    backgroundImage: profile.backgroundType === 'gradient' && /^(linear|radial)-gradient\(/i.test(profile.backgroundGradient || '') ? profile.backgroundGradient : undefined,
    '--profile-display-font': PROFILE_FONTS[profile.displayFont] || PROFILE_FONTS[profile.font] || PROFILE_FONTS.space,
    '--profile-display-weight': profile.displayWeight || 700,
    '--profile-letter-spacing': `${profile.letterSpacing ?? -1}px`,
    '--profile-align': profile.alignment || 'center',
    '--profile-border-width': `${profile.borderWidth ?? 1}px`,
    '--profile-border-color': profile.borderColor || profile.accentColor,
    '--profile-background-x': `${profile.backgroundPositionX ?? 50}%`,
    '--profile-background-y': `${profile.backgroundPositionY ?? 50}%`,
    '--profile-background-blur': `${profile.backgroundBlur ?? 0}px`,
    '--profile-background-brightness': `${profile.backgroundBrightness ?? 100}%`,
    '--profile-background-saturation': `${profile.backgroundSaturation ?? 100}%`,
    '--profile-background-fit': profile.backgroundFit || 'cover',
    '--profile-tilt-x': `${tilt.x}deg`,
    '--profile-tilt-y': `${tilt.y}deg`,
  };

  const moveCard = (event) => {
    if (!profile.enableTilt || reduceMotion || profile.reducedMotionMode || window.matchMedia('(pointer: coarse)').matches) return;
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
    <div ref={pageRef} className={styles.page} style={pageStyle} data-preview={preview} data-density={profile.density || 'comfortable'} data-reduced-motion={reduceMotion || profile.reducedMotionMode} data-effect={profile.backgroundEffect} data-grain={profile.enableGrain} data-surface={profile.surfaceEnabled !== false} data-shadow={profile.surfaceShadow !== false} data-button-style={profile.buttonStyle || 'soft'} data-animated-accent={profile.animatedAccent} data-custom-cursor={profile.customCursor && Boolean(profile.cursorUrl)} onPointerDown={() => { if (clickAudioRef.current) { clickAudioRef.current.currentTime = 0; clickAudioRef.current.play().catch(() => {}); } }} onPointerMove={(event) => { if (profile.customCursor && !preview) setCursorPoint({ x: event.clientX, y: event.clientY }); }}>
      <ProfileBackground profile={profile} videoRef={videoRef} reduceMotion={reduceMotion || profile.reducedMotionMode} entered={entered} />
      {profile.customCursor && profile.cursorUrl && !preview && <img className={styles.customCursor} src={profile.cursorUrl} alt="" aria-hidden="true" style={{ transform: `translate3d(${cursorPoint.x}px, ${cursorPoint.y}px, 0)` }} />}
      <ProfileEntrance profile={profile} entered={entered} entering={entering} onEnter={enter} />
      <ProfileSafetyGate profile={profile} acknowledged={safetyAcknowledged} onContinue={() => setSafetyAcknowledged(true)} onLeave={() => onNavigate('/')} />
      <header className={styles.header}>
        <a href="/" onClick={(event) => { event.preventDefault(); onNavigate('/'); }}><img src="/upetlogoleft.png" alt="user.pet" /></a>
        {owner && <button type="button" onClick={() => onNavigate('/customize')}>edit profile <ExternalLink size={13} /></button>}
      </header>
      <main className={styles.main}>
        <ProfileLayout
          profile={profile}
          reduceMotion={reduceMotion || profile.reducedMotionMode}
          tilt={tilt}
          onPointerMove={moveCard}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        >
          {profile.showBanner && profile.bannerUrl && <img className={styles.banner} src={profile.bannerUrl} alt="" />}
          <div className={styles.identity}>
            {profile.avatarUrl ? <img className={styles.avatar} src={profile.avatarUrl} alt={`${profile.displayName}'s avatar`} style={{ objectPosition: `${profile.avatarCropX ?? 50}% ${profile.avatarCropY ?? 50}%`, transform: `scale(${(profile.avatarZoom ?? 100) / 100}) rotate(${profile.avatarRotation ?? 0}deg)` }} /> : <div className={styles.avatarFallback}>{profile.displayName.slice(0, 1).toUpperCase()}</div>}
            <div className={styles.identityCopy}>
              <h1 data-effect={profile.usernameEffect}>{displayNameText}</h1>
              <p className={styles.handle}>@{profile.username}</p>
              {profile.showStatus && profile.statusText && <p className={styles.status}><i />{profile.statusText}</p>}
            </div>
          </div>
          {(profile.badges || []).length > 0 && <div className={styles.badges}>{profile.badges.slice(0, 6).map((badge) => <span key={badge}><BadgeCheck size={12} />{badge}</span>)}</div>}
          <p className={styles.bio} data-effect={profile.bioEffect}>{displayBio}{profile.bioEffect === 'typewriter' && <i aria-hidden="true" />}</p>
          {profile.location && profile.showLocation && <p className={styles.location}><MapPin size={13} />{profile.location}</p>}
          {profile.blocks?.length ? <ProfileBlocks blocks={profile.blocks} username={profile.username} layout={profile.layout} onGeometryChange={preview ? onCanvasBlockChange : undefined} mobilePreview={mobilePreview} /> : safeLinks.length > 0 && <nav className={styles.links} aria-label="Profile links">{safeLinks.map((link, index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noopener noreferrer" onClick={() => recordProfileEvent(profile.username, 'click', `legacy-${index}`)}><span><Sparkles size={13} />{link.label}</span><ExternalLink size={14} /></a>)}</nav>}
          {activeTrack?.url && profile.document?.audio?.enabled !== false && <div className={styles.player}>
            <button type="button" onClick={toggleAudio} aria-label={playing ? 'Pause music' : 'Play music'}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
            {activeTrack.cover ? <img className={styles.trackCover} src={activeTrack.cover} alt="" /> : <Music2 size={16} />}
            <span><strong>{activeTrack.title || 'Profile audio'}</strong><small>{activeTrack.artist || profile.displayName}</small></span>
            {profile.showVisualizer ? <span className={styles.visualizer} data-playing={playing} aria-label={playing ? 'Audio visualizer playing' : 'Audio visualizer paused'}>{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</span> : <Volume2 size={15} />}
          </div>}
          <audio ref={audioRef} src={activeTrack?.url || ''} loop={profile.audioLoop && tracks.length === 1} onEnded={() => { if (tracks.length > 1) setTrackIndex((index) => profile.audioShuffle ? Math.floor(Math.random() * tracks.length) : (index + 1) % tracks.length); }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
          {tracks.length > 1 && <div className={styles.playlistControls}><button type="button" onClick={() => setTrackIndex((index) => (index - 1 + tracks.length) % tracks.length)}>Previous</button><span>{trackIndex + 1} / {tracks.length}</span><button type="button" onClick={() => setTrackIndex((index) => (index + 1) % tracks.length)}>Next</button></div>}
          {activeTrack?.url && profile.document?.audio?.enabled !== false && profile.showVolumeControl && <label className={styles.volume}><Volume2 size={13} /><input type="range" min="0" max="100" value={volume} aria-label="Profile music volume" onChange={(event) => { const next = Number(event.target.value); setVolume(next); if (audioRef.current) audioRef.current.volume = next / 100; }} /><span>{volume}%</span></label>}
        </ProfileLayout>
      </main>
      <footer className={styles.footer}><button type="button" onClick={() => onNavigate('/')}><ArrowLeft size={12} /> user<span>.pet</span></button></footer>
    </div>
  );
}

