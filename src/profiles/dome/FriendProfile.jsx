import React, { useEffect, useRef, useState } from 'react';
import { Music2, Pause, Play, ShoppingBag } from 'lucide-react';
import { FFTVisualizer } from '@fft-visualizer/react';
import '@fft-visualizer/react/style.css';
import styles from './FriendProfile.module.css';
import { pauseOtherProfileAudio } from '../../shared/profileAudio.js';

const MUSIC_SRC = '/Juice-WRLD-Lucid-Dreams-(HipHopKit.com)_[cut_90sec].mp3';
const VISUALIZER_BANDS = 40;
const VISUALIZER_GRADIENT = [
  { stop: 0, color: '#641a21' },
  { stop: 0.48, color: '#e64a56' },
  { stop: 1, color: '#ffc0c5' },
];

export default function FriendProfile({ active = true }) {
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

  return (
    <aside className={styles.preview} aria-label="15ry profile">
      <div className={styles.motion}>
        <article className={styles.card} data-profile-surface="" aria-labelledby="friend-profile-name">
          <img className={styles.avatar} src="/domespfp.png" alt="dome's profile picture" />
          <h2 className={styles.displayName} id="friend-profile-name">dome</h2>
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
            <img className={styles.spotifyIcon} src="/spotify.png" alt="Spotify" />
            <img className={styles.robloxIcon} src="/roblox.png" alt="Roblox" />
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
          </button>

          <audio
            ref={audioRef}
            data-profile-audio=""
            src={MUSIC_SRC}
            preload="none"
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
        </article>
      </div>
    </aside>
  );
}
