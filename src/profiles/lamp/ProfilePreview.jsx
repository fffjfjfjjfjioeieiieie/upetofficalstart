import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Music2, Pause, Play } from 'lucide-react';
import { FFTVisualizer } from '@fft-visualizer/react';
import { gsap } from 'gsap';
import '@fft-visualizer/react/style.css';
import styles from './ProfilePreview.module.css';
import ProfileBanner from './ProfileBanner.jsx';
import ProfileBackground from '../../shared/ProfileBackground.jsx';
import ProfileIdentity from '../../shared/ProfileIdentity.jsx';
import { profileData } from '../../shared/profileData.js';
import { pauseOtherProfileAudio } from '../../shared/profileAudio.js';

const MUSIC_SRC = '/WHXRE (prod. sqvxlls).mp3';
const VISUALIZER_BANDS = 40;
const WAVE_CYCLES = 5;
const VISUALIZER_GRADIENT = [
  { stop: 0, color: '#173b67' },
  { stop: 0.5, color: '#4b9dea' },
  { stop: 1, color: '#c6e8ff' },
];

export default function ProfilePreview({ musicControlRef, onMusicStateChange }) {
  const audioRef = useRef(null);
  const visualizerRef = useRef(null);
  const dividerRef = useRef(null);
  const waveElementsRef = useRef([]);
  const wavePathsRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const frequencyDataRef = useRef(null);
  const animationFrameRef = useRef(null);
  const visualizerDataRef = useRef(new Uint8Array(VISUALIZER_BANDS));
  const [readyVisuals, setReadyVisuals] = useState({ background: false, banner: false });
  const [playing, setPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState('');

  const markVisualReady = (asset) => {
    setReadyVisuals((current) => current[asset] ? current : { ...current, [asset]: true });
  };

  useEffect(() => {
    const divider = dividerRef.current;
    const waveElements = waveElementsRef.current;
    const wavePaths = wavePathsRef.current;
    if (!divider || waveElements.some((element) => !element) || wavePaths.some((path) => !path)) return undefined;

    const progress = { value: 0 };
    const drawWave = () => {
      const dividerRect = divider.getBoundingClientRect();
      const totalWidth = Math.max(1, dividerRect.width);
      const amplitude = 8;
      const sampleCount = 64;

      waveElements.forEach((element, index) => {
        const elementRect = element.getBoundingClientRect();
        const startX = elementRect.left - dividerRect.left;
        const elementWidth = elementRect.width;
        const points = [];

        for (let sample = 0; sample <= sampleCount; sample += 1) {
          const localProgress = sample / sampleCount;
          const globalX = startX + elementWidth * localProgress;
          const normalizedX = globalX / totalWidth;
          const envelope = Math.sin(Math.PI * normalizedX);
          const phase = 2 * Math.PI * WAVE_CYCLES * (normalizedX - progress.value);
          const y = 11 + amplitude * envelope * Math.sin(phase);
          points.push(`${sample === 0 ? 'M' : 'L'}${(localProgress * 1000).toFixed(2)} ${y.toFixed(2)}`);
        }

        wavePaths[index].setAttribute('d', points.join(' '));
      });
    };

    drawWave();
    const animation = gsap.to(progress, {
      value: 1,
      duration: 8,
      ease: 'none',
      repeat: -1,
      onUpdate: drawWave,
    });
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(drawWave);
    resizeObserver?.observe(divider);

    return () => {
      animation.kill();
      resizeObserver?.disconnect();
    };
  }, []);

  const cancelEqualizerAnimation = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const feedEqualizer = (bands) => {
    visualizerRef.current?.feedData(bands);
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
    cancelEqualizerAnimation();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  }, []);

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

  useEffect(() => {
    if (!musicControlRef) return undefined;
    musicControlRef.current = toggleMusic;
    return () => {
      if (musicControlRef.current === toggleMusic) musicControlRef.current = null;
    };
  }, [musicControlRef, toggleMusic]);

  return (
      <aside
        className={styles.preview}
        aria-label={`${profileData.displayName} profile preview`}
      >
      <div className={styles.motion}>
        <article className={styles.card} data-profile-surface="" aria-labelledby="lamp-profile-name">
          <div className={styles.visuals} data-ready={readyVisuals.background && readyVisuals.banner} aria-hidden="true">
            <ProfileBackground onReady={() => markVisualReady('background')} />
            <ProfileBanner onReady={() => markVisualReady('banner')} />
          </div>
          <div className={styles.content}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>
                <span className={styles.avatarFallback}>L</span>
                <img
                  src="/lamp-banner.jpg"
                  alt="Lamp's profile picture"
                  onError={(event) => { event.currentTarget.hidden = true; }}
                />
              </div>
            </div>

            <ProfileIdentity name={profileData.displayName} username={profileData.username} />
            <p className={styles.badges}>
              <img className={styles.crownBadge} src="/badge.png" alt="Profile badge" />
              <img className={styles.verifiedBadge} src="/verified%20seller.png" alt="Verified seller" />
            </p>
            <p className={styles.bio}>Art commissions open · prints ship worldwide</p>

            <div className={styles.music}>
              <div ref={dividerRef} className={styles.divider} data-playing={playing} aria-hidden="true">
                <span ref={(element) => { waveElementsRef.current[0] = element; }} className={`${styles.wave} ${styles.waveLeft}`}>
                  <svg className={styles.waveTrack} viewBox="0 0 1000 22" preserveAspectRatio="none">
                    <path ref={(path) => { wavePathsRef.current[0] = path; }} d="M0 11 H1000" />
                  </svg>
                </span>
                <div className={styles.spectrum}>
                  <FFTVisualizer
                    ref={visualizerRef}
                    mode="external"
                    bands={VISUALIZER_BANDS}
                    gradient={VISUALIZER_GRADIENT}
                    gradientDirection="vertical"
                    reflexRatio={0.28}
                    reflexAlpha={0.14}
                    glow={0.2}
                    smoothing={0.66}
                    noiseFloor={8}
                    showPeaks={false}
                    background="transparent"
                    showStats={false}
                  />
                </div>
                <span ref={(element) => { waveElementsRef.current[1] = element; }} className={`${styles.wave} ${styles.waveRight}`}>
                  <svg className={styles.waveTrack} viewBox="0 0 1000 22" preserveAspectRatio="none">
                    <path ref={(path) => { wavePathsRef.current[1] = path; }} d="M0 11 H1000" />
                  </svg>
                </span>
              </div>
              <button
                className={styles.musicButton}
                type="button"
                onClick={toggleMusic}
                aria-label={playing ? 'Pause WHXRE by whatsaheart' : 'Play WHXRE by whatsaheart'}
                aria-pressed={playing}
              >
                <span className={styles.musicIcon} aria-hidden="true"><Music2 size={15} /></span>
                <span className={styles.trackDetails}>
                  <strong>WHXRE</strong>
                  <span>whatsaheart</span>
                </span>
                <span className={styles.playIcon} aria-hidden="true">
                  {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </span>
              </button>
              {playbackError && <span className={styles.playbackStatus} role="status">{playbackError}</span>}
            </div>

            <div className={styles.sales}>
              <span>Total sales</span>
              <strong>{profileData.totalSales}</strong>
            </div>
          </div>
          <audio
            ref={audioRef}
            data-profile-audio=""
            src={MUSIC_SRC}
            preload="none"
            onPlay={() => {
              pauseOtherProfileAudio(audioRef.current);
              setPlaying(true);
              onMusicStateChange?.(true);
              if (analyserRef.current) {
                cancelEqualizerAnimation();
                animationFrameRef.current = window.requestAnimationFrame(animateEqualizer);
              }
            }}
            onPause={() => {
              setPlaying(false);
              onMusicStateChange?.(false);
              fadeEqualizer();
            }}
            onEnded={() => {
              setPlaying(false);
              onMusicStateChange?.(false);
              fadeEqualizer();
            }}
            onError={() => {
              setPlaying(false);
              onMusicStateChange?.(false);
              fadeEqualizer();
              setPlaybackError('Music could not be loaded.');
            }}
          />
        </article>
      </div>

    </aside>
  );
}
