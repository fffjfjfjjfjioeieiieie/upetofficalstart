import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Music2, Pause, Play, ShoppingBag, Volume2, VolumeX } from 'lucide-react';
import { FFTVisualizer } from '@fft-visualizer/react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import * as Slider from '@radix-ui/react-slider';
import * as Tooltip from '@radix-ui/react-tooltip';
import '@fft-visualizer/react/style.css';
import styles from './DomeShowcase.module.css';
import { pauseOtherProfileAudio } from '../../shared/profileAudio.js';

const MUSIC_SRC = '/Juice-WRLD-Lucid-Dreams-(HipHopKit.com)_[cut_90sec].mp3';
const VISUALIZER_BANDS = 40;
const VISUALIZER_GRADIENT = [
  { stop: 0, color: '#12355f' },
  { stop: 0.48, color: '#28a8f6' },
  { stop: 1, color: '#a7ddff' },
];

export default function DomeShowcase({ active = true, standalone = false, isOwner = false }) {
  const audioRef = useRef(null);
  const visualizerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioSourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const frequencyDataRef = useRef(null);
  const visualizerDataRef = useRef(new Uint8Array(VISUALIZER_BANDS));
  const [playing, setPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const Heading = standalone ? 'h1' : 'h2';
  const Surface = standalone ? motion.article : 'article';
  const reduceMotion = useReducedMotion();
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 160, damping: 24 });
  const rotateY = useSpring(tiltY, { stiffness: 160, damping: 24 });
  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

  useEffect(() => {
    if (!standalone) return undefined;
    const previousTitle = document.title;
    document.title = 'dome (@15ry) | user.pet';
    return () => { document.title = previousTitle; };
  }, [standalone]);

  useEffect(() => {
    if (standalone && audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [standalone, volume, muted]);

  const copyProfile = async () => {
    try {
      await navigator.clipboard.writeText('https://user.pet/dome');
      setCopyStatus('Link copied');
    } catch {
      setCopyStatus('Copy this link: https://user.pet/dome');
    }
  };

  useEffect(() => {
    if (!copyStatus) return undefined;
    const timer = window.setTimeout(() => setCopyStatus(''), 4500);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  const updateTilt = (event) => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    tiltX.set((0.5 - (event.clientY - bounds.top) / bounds.height) * 3);
    tiltY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 3);
  };

  const resetTilt = () => { tiltX.set(0); tiltY.set(0); };

  const cancelEqualizerAnimation = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const feedEqualizer = (bands) => {
    visualizerRef.current?.feedData(bands);
  };

  const stopEqualizer = () => {
    cancelEqualizerAnimation();
    visualizerDataRef.current.fill(0);
    feedEqualizer(visualizerDataRef.current);
  };

  const fadeEqualizer = () => {
    cancelEqualizerAnimation();
    const startingLevels = visualizerDataRef.current.slice();
    const fadeStartedAt = performance.now();
    const fadeDuration = 460;

    const animateFade = (now) => {
      const progress = Math.min(1, (now - fadeStartedAt) / fadeDuration);
      const remaining = (1 - progress) ** 2;
      const bands = visualizerDataRef.current;

      for (let index = 0; index < bands.length; index += 1) {
        bands[index] = Math.round(startingLevels[index] * remaining);
      }

      feedEqualizer(bands);

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animateFade);
      } else {
        bands.fill(0);
        feedEqualizer(bands);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(animateFade);
  };

  const animateEqualizer = () => {
    const audio = audioRef.current;
    const analyser = analyserRef.current;
    if (!audio || !analyser || audio.paused || audio.ended) {
      fadeEqualizer();
      return;
    }

    const frequencies = frequencyDataRef.current;
    analyser.getByteFrequencyData(frequencies);

    const bands = visualizerDataRef.current;
    for (let index = 0; index < VISUALIZER_BANDS; index += 1) {
      const start = Math.max(1, Math.floor(2 ** ((index / VISUALIZER_BANDS) * Math.log2(frequencies.length))));
      const end = Math.max(start + 1, Math.floor(2 ** (((index + 1) / VISUALIZER_BANDS) * Math.log2(frequencies.length))));
      let peak = 0;

      for (let bin = start; bin < Math.min(end, frequencies.length); bin += 1) {
        peak = Math.max(peak, frequencies[bin]);
      }

      const volume = Math.max(0, (peak - 8) / 247);
      bands[index] = Math.round((volume ** 0.78) * 220);
    }

    feedEqualizer(bands);
    animationFrameRef.current = window.requestAnimationFrame(animateEqualizer);
  };

  const prepareAudioAnalysis = async () => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return;

    try {
      if (!audioContextRef.current) {
        const context = new AudioContextConstructor();
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.72;
        analyser.minDecibels = -88;
        analyser.maxDecibels = -18;

        const source = context.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(context.destination);

        audioContextRef.current = context;
        analyserRef.current = analyser;
        audioSourceRef.current = source;
        frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    } catch {
      // Keep playback available if the browser cannot create an analyser.
      analyserRef.current = null;
    }
  };

  useEffect(() => () => {
    stopEqualizer();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!active) audioRef.current?.pause();
  }, [active]);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    setPlaybackError('');
    try {
      await prepareAudioAnalysis();
      await audio.play();
    } catch {
      setPlaying(false);
      setPlaybackError('Music could not be played.');
    }
  };

  const profile = (
    <aside className={`${styles.preview}${standalone ? ` ${styles.standalone}` : ''}`} aria-label="Dome's profile">
      <div className={styles.motion}>
        <Surface className={styles.card} data-profile-surface="" aria-labelledby="dome-showcase-name" {...(standalone ? {
          initial: reduceMotion ? false : { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: 'easeOut' },
          style: reduceMotion ? undefined : { rotateX, rotateY },
          onPointerMove: updateTilt,
          onPointerLeave: resetTilt,
          onPointerDown: resetTilt,
        } : {})}>
          {standalone && <div className={styles.profileLabel}><span>user<span className={styles.petAccent}>.pet</span> / dome</span><span className={styles.labelDot} aria-hidden="true" /></div>}
          <img className={styles.avatar} src="/domespfp.png" alt="dome's profile picture" />
          <Heading className={styles.displayName} id="dome-showcase-name">{standalone ? 'dome' : <a className={styles.profileLink} href="/dome" aria-label="Open Dome's profile">dome</a>}</Heading>
          <p className={styles.username}>@15ry</p>
          <p className={styles.badges}>
            <img src="/badge.png" alt="Profile badge" />
          </p>
          <p className={styles.bio}>what is disssss?</p>
          <div className={styles.divider} data-playing={playing} aria-hidden="true">
            <div className={styles.spectrum}>
              <FFTVisualizer
                ref={visualizerRef}
                mode="external"
                bands={VISUALIZER_BANDS}
                gradient={VISUALIZER_GRADIENT}
                gradientDirection="vertical"
                reflexRatio={0.34}
                reflexAlpha={0.18}
                glow={0.24}
                smoothing={0.62}
                noiseFloor={8}
                showPeaks={false}
                background="transparent"
                showStats={false}
              />
            </div>
          </div>

          <div className={styles.socialIcons} role="group" aria-label="Spotify and Roblox">
            {standalone ? <Tooltip.Provider delayDuration={150}>
              {[['Spotify', '/spotify.png', styles.spotifyIcon], ['Roblox', '/roblox.png', styles.robloxIcon]].map(([label, src, iconClass]) => (
                <Tooltip.Root key={label}>
                  <Tooltip.Trigger asChild><span className={styles.socialPlaceholder} tabIndex={0} aria-label={`${label}: link coming soon`}><img className={iconClass} src={src} alt="" /></span></Tooltip.Trigger>
                  <Tooltip.Portal><Tooltip.Content className={styles.tooltip} sideOffset={8}>{label} · link coming soon<Tooltip.Arrow className={styles.tooltipArrow} /></Tooltip.Content></Tooltip.Portal>
                </Tooltip.Root>
              ))}
            </Tooltip.Provider> : <><img className={styles.spotifyIcon} src="/spotify.png" alt="Spotify" /><img className={styles.robloxIcon} src="/roblox.png" alt="Roblox" /></>}
          </div>

          <button
            className={styles.musicButton}
            type="button"
            onClick={toggleMusic}
            aria-label={playing ? 'Pause Lucid Dreams by Juice WRLD' : 'Play Lucid Dreams by Juice WRLD'}
            aria-pressed={playing}
          >
            <span className={styles.musicIcon} aria-hidden="true"><Music2 size={17} /></span>
            <span className={styles.trackDetails}>
              <strong>Lucid Dreams</strong>
              <span>Juice WRLD</span>
            </span>
            <span className={styles.playIcon} aria-hidden="true">
              {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </span>
          </button>
          {standalone && (
            <div className={styles.playerControls}>
              <div className={styles.seekRow}>
                <span>{formatTime(elapsed)}</span>
                <Slider.Root className={styles.slider} min={0} max={duration || 1} step={0.1} value={[elapsed]} disabled={!duration} onValueChange={([next]) => {
                  if (audioRef.current) audioRef.current.currentTime = next;
                  setElapsed(next);
                }}><Slider.Track className={styles.sliderTrack}><Slider.Range className={styles.sliderRange} /></Slider.Track><Slider.Thumb className={styles.sliderThumb} aria-label="Seek Lucid Dreams" aria-valuetext={`${formatTime(elapsed)} of ${formatTime(duration)}`} /></Slider.Root>
                <span>{formatTime(duration)}</span>
              </div>
              <div className={styles.volumeRow}>
                <span className={styles.nowPlaying}>{playing ? 'now playing' : 'press play, stay a while'}</span>
                <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Unmute music' : 'Mute music'} aria-pressed={muted}>
                  {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <Slider.Root className={`${styles.slider} ${styles.volumeSlider}`} min={0} max={1} step={0.01} value={[muted ? 0 : volume]} onValueChange={([next]) => { setVolume(next); setMuted(false); }}><Slider.Track className={styles.sliderTrack}><Slider.Range className={styles.sliderRange} /></Slider.Track><Slider.Thumb className={styles.sliderThumb} aria-label="Music volume" aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)} percent`} /></Slider.Root>
              </div>
            </div>
          )}
          <span className={styles.playbackStatus} role="status" aria-live="polite">
            {playbackError}
          </span>

          <button
            className={styles.shopButton}
            type="button"
            disabled
            aria-label="Shop unavailable for this profile"
          >
            <ShoppingBag size={14} aria-hidden="true" />
            <span>Shop</span>
            {standalone && <span className={styles.comingSoon}>coming soon</span>}
          </button>

          <audio
            ref={audioRef}
            data-profile-audio=""
            src={MUSIC_SRC}
            preload={standalone ? 'metadata' : 'none'}
            onLoadedMetadata={() => setDuration(Number.isFinite(audioRef.current?.duration) ? audioRef.current.duration : 0)}
            onTimeUpdate={() => { if (standalone) setElapsed(audioRef.current?.currentTime || 0); }}
            onPlay={() => {
              pauseOtherProfileAudio(audioRef.current);
              setPlaying(true);
              if (analyserRef.current) {
                cancelEqualizerAnimation();
                animationFrameRef.current = window.requestAnimationFrame(animateEqualizer);
              }
            }}
            onPause={() => {
              setPlaying(false);
              fadeEqualizer();
            }}
            onEnded={() => {
              setPlaying(false);
              fadeEqualizer();
            }}
            onError={() => {
              setPlaying(false);
              fadeEqualizer();
              setPlaybackError('Music could not be loaded.');
            }}
          />
        </Surface>
      </div>
    </aside>
  );

  if (!standalone) return profile;

  return (
    <div className={styles.profilePage}>
      <div className={styles.atmosphere} aria-hidden="true" />
      <header className={styles.pageHeader}>
        <a href="/" className={styles.homeLink} aria-label="user.pet home"><img src="/upetlogoleft.png" alt="user.pet" /></a>
        <div className={styles.headerActions}>
          {isOwner && <a className={styles.ownerLink} href="/dashboard">your dashboard <ArrowUpRight size={14} /></a>}
          <button className={styles.shareButton} type="button" onClick={copyProfile}>{copyStatus === 'Link copied' ? <Check size={15} /> : <Copy size={15} />}<span>{copyStatus === 'Link copied' ? 'copied' : 'share profile'}</span></button>
        </div>
      </header>
      <main className={styles.profileMain}>{profile}</main>
      <footer className={styles.pageFooter}><a href="/">a little space on user<span>.pet</span><ArrowUpRight size={12} /></a><span>just dome.</span></footer>
      <span className={styles.shareStatus} role="status">{copyStatus}</span>
    </div>
  );
}

