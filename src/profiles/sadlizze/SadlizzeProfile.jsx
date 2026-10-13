import React, { useRef, useState } from 'react';
import { ArrowRight, Music2, Pause, Play, ShoppingBag } from 'lucide-react';
import ProfileBackground from '../../shared/ProfileBackground.jsx';
import { pauseOtherProfileAudio } from '../../shared/profileAudio.js';

const MUSIC_SRC = '/me-again-lil-tjay.mp3';

export default function SadlizzeProfile({ onShopClick }) {
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const musicRef = useRef(null);

  const toggleMusic = () => {
    const audio = musicRef.current;
    if (!audio) return;

    if (audio.paused) {
      pauseOtherProfileAudio(audio);
      audio.play().catch(() => {});
      return;
    }

    audio.pause();
  };

  return (
    <aside className="sadlizze-preview" aria-label="sadlizze profile preview">
      <div className="sadlizze-motion">
        <article
          className="sadlizze-card"
          data-profile-surface=""
          aria-labelledby="sadlizze-profile-name"
        >
          <div className="sadlizze-visuals" data-ready={backgroundReady} aria-hidden="true">
            <ProfileBackground
              src="/sadlizze.mp4"
              poster={null}
              onReady={() => setBackgroundReady(true)}
            />
          </div>
          <div className="sadlizze-profile-head">
            <div className="sadlizze-identity">
              <div className="sadlizze-name-row">
                <h2 id="sadlizze-profile-name">sadlizze</h2>
                <img className="sadlizze-crown-badge" src="/badge.png" alt="Profile badge" />
              </div>
              <p>@sadlizze</p>
            </div>
            <div className="sadlizze-avatar-frame">
              <img
                className="sadlizze-avatar-decoration"
                src="/ChatGPT_Image_Sep_30__2026__09_59_36_PM-removebg-preview.png"
                alt=""
                aria-hidden="true"
              />
              <img className="sadlizze-avatar" src="/love.png" alt="sadlizze profile picture" />
            </div>
          </div>

          <p className="sadlizze-bio">ur not srs r uuuuuu?</p>

          <button
            className="sadlizze-music-player"
            type="button"
            data-playing={musicPlaying}
            onClick={toggleMusic}
            aria-label={musicPlaying ? 'Pause Me Again by Lil Tjay' : 'Play Me Again by Lil Tjay'}
            aria-pressed={musicPlaying}
          >
            <span className="sadlizze-music-icon" aria-hidden="true"><Music2 size={15} /></span>
            <span className="sadlizze-music-title">
              <strong>Me Again</strong>
              <small>Lil Tjay</small>
            </span>
            <span className="sadlizze-music-play-icon" aria-hidden="true">
              {musicPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </span>
          </button>
          <audio
            ref={musicRef}
            data-profile-audio=""
            src={MUSIC_SRC}
            preload="none"
            onPlay={() => {
              pauseOtherProfileAudio(musicRef.current);
              setMusicPlaying(true);
            }}
            onPause={() => setMusicPlaying(false)}
            onEnded={() => setMusicPlaying(false)}
            aria-label="Me Again by Lil Tjay"
          />
          <div className="sadlizze-sales">
            <span>Total sales</span>
            <strong>84</strong>
          </div>

          <button className="sadlizze-shop-button" type="button" disabled aria-label="Shop unavailable for now">
            <ShoppingBag size={14} aria-hidden="true" />
            <span>Shop</span>
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </article>
      </div>
    </aside>
  );
}
