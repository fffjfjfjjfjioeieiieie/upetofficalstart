import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Brush,
  Check,
  Gift,
  Globe2,
  Music2,
  Pause,
  Palette,
  Play,
  Smile,
} from 'lucide-react';
import ProfileIdentity from '../shared/ProfileIdentity.jsx';
import { profileData } from '../shared/profileData.js';

const listings = [
  {
    id: 'portrait-commission',
    title: 'Custom portrait commission',
    stats: 'Digital illustration · 1 character · 2 revisions · 5–7 days',
    category: 'Commission',
    price: '£30.00',
    Icon: Palette,
    imageSrc: '/portait.jpg',
    layout: 'feature',
    accent: '#c7a8ff',
    tint: 'rgba(151, 119, 217, 0.2)',
  },
  {
    id: 'full-body-commission',
    title: 'Full-body character art',
    stats: 'Custom pose · colour background · 7–10 day turnaround',
    category: 'Commission',
    price: '£55.00',
    Icon: Brush,
    imageSrc: '/fullbodycharacterart.jpg',
    layout: 'single',
    accent: '#83c2f7',
    tint: 'rgba(74, 134, 190, 0.2)',
  },
  {
    id: 'emote-pack',
    title: 'Custom emote trio',
    stats: '3 expressions · transparent PNGs · Twitch / Discord ready',
    category: 'Digital art',
    price: '£18.00',
    Icon: Smile,
    imageSrc: '/emojitrio.jpg',
    layout: 'tall',
    accent: '#a99cf4',
    tint: 'rgba(119, 104, 206, 0.2)',
  },
  {
    id: 'worldwide-prints',
    title: 'Signed art print set',
    stats: '3 A5 prints · carefully packed · ships worldwide',
    category: 'Worldwide shipping',
    price: '£22.00',
    Icon: Globe2,
    imageSrc: '/signed%20art%20print%20set.jpg',
    layout: 'username',
    accent: '#8fbce8',
    tint: 'rgba(85, 132, 188, 0.19)',
  },
  {
    id: 'art-print-giveaway',
    title: 'Mini print giveaway',
    stats: 'Signed original mini print · open worldwide · 18 entries · 24h left',
    category: 'Giveaway',
    price: 'FREE',
    Icon: Gift,
    layout: 'giveaway',
    accent: '#8ecfc8',
    tint: 'rgba(67, 153, 155, 0.18)',
  },
];

export default function LampShop({ onBack, musicAvailable = false, musicPlaying = false, onMusicToggle }) {
  const [giveawayJoined, setGiveawayJoined] = useState(false);

  return (
    <section className="lamp-shop" aria-labelledby="lamp-profile-name">
      <button className="shop-back" type="button" onClick={onBack}>
        <ArrowLeft size={15} /> Back home
      </button>

      <div className="shop-panel">
        <div className="shop-header">
          <div className="shop-seller">
            <img className="shop-avatar" src="/lamp-banner.jpg" alt={`${profileData.displayName}’s profile picture`} />
            <ProfileIdentity
              name={profileData.displayName}
              username={profileData.username}
              align="start"
              headingLevel={1}
            />
          </div>
          <div className="seller-meta">
            {musicAvailable && (
              <button
                className="shop-music-control"
                type="button"
                onClick={onMusicToggle}
                aria-label={musicPlaying ? 'Pause WHXRE by whatsaheart' : 'Play WHXRE by whatsaheart'}
                aria-pressed={musicPlaying}
              >
                <span className="shop-music-icon" aria-hidden="true"><Music2 size={14} /></span>
                <span className="shop-music-copy">
                  <strong>WHXRE</strong>
                  <span>whatsaheart</span>
                </span>
                <span className={`shop-music-status${musicPlaying ? ' is-playing' : ''}`} aria-hidden="true" />
                {musicPlaying ? <Pause size={13} fill="currentColor" aria-hidden="true" /> : <Play size={13} fill="currentColor" aria-hidden="true" />}
              </button>
            )}
            <div className="seller-sales">
              <span>Total sales</span>
              <strong>{profileData.totalSales}</strong>
            </div>
            <div className="seller-rating">
              <img src="/verified%20seller.png" alt="" aria-hidden="true" />
              <span>Verified seller</span>
            </div>
          </div>
        </div>

        <div className="shop-wave-divider" aria-hidden="true">
          <svg viewBox="0 0 1000 24" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lamp-shop-wave-gradient" x1="0" x2="1">
                <stop offset="0%" stopColor="#77bdf3" stopOpacity="0" />
                <stop offset="28%" stopColor="#77bdf3" stopOpacity="0.72" />
                <stop offset="72%" stopColor="#bca3f5" stopOpacity="0.68" />
                <stop offset="100%" stopColor="#bca3f5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="shop-wave-line shop-wave-line-soft" d="M0 13 C110 1 175 1 250 12 S390 23 500 12 S640 1 750 12 S890 23 1000 11" />
            <path className="shop-wave-line" d="M0 10 C115 21 180 21 260 11 S405 1 510 12 S650 22 760 11 S900 2 1000 13" />
          </svg>
        </div>

        <div className="listing-grid">
          {listings.map((listing, index) => {
            const { id, title, stats, category, price, Icon, imageSrc, layout, accent, tint } = listing;
            const displayedStats = id === 'art-print-giveaway' && giveawayJoined
              ? stats.replace('18 entries', '19 entries')
              : stats;

            return (
              <article
                className={`listing-card listing-card-${layout}${imageSrc ? ' listing-card-has-art' : ''}`}
                key={id}
                style={{ '--listing-accent': accent, '--listing-tint': tint }}
                aria-labelledby={`listing-title-${id}`}
              >
                {imageSrc && <img className="listing-banner" src={imageSrc} alt="" aria-hidden="true" />}
                <div className="listing-card-top">
                  <div className="listing-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.7} />
                  </div>
                  <span className="listing-category">{category}</span>
                  <span className="listing-number">#{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h2 id={`listing-title-${id}`}>{title}</h2>
                <p className="listing-stats">{displayedStats}</p>
                <div className="listing-card-bottom">
                  <strong>{price}</strong>
                  {id === 'art-print-giveaway' ? (
                    <button
                      className="giveaway-button"
                      type="button"
                      aria-pressed={giveawayJoined}
                      onClick={() => setGiveawayJoined(true)}
                    >
                      {giveawayJoined ? <>Entered <Check size={15} /></> : <>Join giveaway <ArrowRight size={15} /></>}
                    </button>
                  ) : (
                    <span className="listing-action" aria-hidden="true">
                      <ArrowUpRight size={16} />
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <p className="shop-disclaimer">Example art listings, details, and prices for preview only.</p>
      </div>
    </section>
  );
}
