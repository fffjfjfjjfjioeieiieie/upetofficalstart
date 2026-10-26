import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BarChart3, Check, Copy, Crown, Eye, LayoutTemplate, Link2, MessageCircle, Palette, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar, BadgeIcon, isVideoMedia } from '../components/ProfileBits';
import styles from './Home.module.css';
import { BrowserChrome, SiteAction, SiteKicker } from '../components/SitePrimitives';

const previewImage = (media, width) => media?.src && !isVideoMedia(media)
  ? `/api/media-preview?url=${encodeURIComponent(media.src)}&w=${width}`
  : '';

const TopProfile = ({ entry, slot }) => {
  const accent = entry.card.accent;
  const image = (entry.card.layout === 'banner' ? previewImage(entry.banner, 520) : '') || previewImage(entry.background, 520);
  return <Link to={`/${entry.username}`} data-testid={`top-profile-${slot}`} aria-label={`View ${entry.displayName}'s profile`} className={styles.profileCard} style={{ '--profile-accent': accent, '--profile-bg': entry.card.bgColor }}>
    <div className={styles.profileImage} aria-hidden="true">{image && <img src={image} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true; }} />}</div>
    <div className={styles.profileContent}>
      <div className={styles.profileTopline}><span><Crown size={13} /> Community pick</span><ArrowUpRight size={17} /></div>
      <div className={styles.profileAvatar}><Avatar media={entry.avatar} name={entry.username} size={76} /></div>
      <h3>{entry.displayName}</h3>
      <p className={styles.profileHandle}>@{entry.username}{entry.alias && entry.alias !== entry.username ? ` · ${entry.alias}` : ''}</p>
      <div className={styles.profileBadges}>{entry.badges.slice(0, 2).map((badge) => <BadgeIcon key={badge} id={badge} size={11} />)}</div>
      <p className={styles.profileBio}>{entry.bio || 'Take a look at this page.'}</p>
      <div className={styles.profileBottom}><span><Eye size={14} />{entry.views.toLocaleString()} views</span><span><Link2 size={14} />{entry.linkCount} links</span></div>
    </div>
  </Link>;
};

const ProfilePlaceholder = () => <div className={styles.profilePlaceholder} aria-hidden="true"><span>Featured profile</span><div className={styles.placeholderAvatar} /><div className={styles.placeholderLine} /><div className={styles.placeholderLineShort} /><div className={styles.placeholderButton} /></div>;

const rotationDelay = () => 180000 + Math.floor(Math.random() * 120001);
const pickProfiles = (profiles) => {
  const pool = [...profiles];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[next]] = [pool[next], pool[index]];
  }
  return pool.slice(0, 3);
};

export const HeroPreview = ({ user }) => {
  const profile = user?.profile;
  const banner = (profile?.card?.layout === 'banner' ? previewImage(profile?.media?.banner, 640) : '') || previewImage(profile?.media?.background, 640);
  const links = profile?.links?.slice(0, 3) || [];
  const rows = links.slice(0, 3);
  const previewStyle = profile ? {
    '--preview-accent': profile.card?.accent || '#6cc4ff',
    '--preview-background': profile.card?.bgColor || '#07111f',
    '--preview-surface': profile.card?.cardColor || '#0b1626',
    '--preview-text': profile.card?.textColor || '#ffffff',
  } : undefined;

  return <div className={styles.heroVisual} aria-label={profile ? `Preview of ${user.username}'s profile` : 'Illustrative user.pet profile preview'} data-testid="hero-profile-preview" style={previewStyle}>
  <div className={styles.previewHalo} />
  {profile ? <Link to={`/${user.username}`} className={`${styles.previewWindow} ${styles.userPreviewWindow}`} aria-label={`Open your profile at user.pet/${user.username}`}>
    <BrowserChrome className={styles.previewBar} address={`user.pet/${user.username}`}/>
    <div className={`${styles.previewBanner} ${styles.userPreviewBanner}`} aria-hidden="true">{banner && <img src={banner} alt="" decoding="async" fetchPriority="low" onError={(event) => { event.currentTarget.hidden = true; }} />}</div>
    <div className={styles.previewBody}>
      <div className={styles.userPreviewAvatar}><Avatar media={profile.media?.avatar} name={user.username} size={76} /></div>
      <div className={styles.previewName}>{profile.displayName || user.username}</div>
      <div className={styles.userPreviewHandle}>@{user.username}</div>
      {profile.bio && <p className={styles.userPreviewBio}>{profile.bio}</p>}
      <div className={styles.userPreviewRows}>
        {rows.map((link) => <div className={styles.previewLink} key={link.id || link.url}><Link2 size={17} /><span>{link.label || link.platform || 'Link'}</span><ArrowUpRight size={16} /></div>)}
        {!rows.length && <div className={styles.userPreviewEmpty}>Add your first link to bring your page to life.</div>}
      </div>
    </div>
  </Link> : <div className={styles.previewWindow}>
    <BrowserChrome className={styles.previewBar} address="user.pet/yourname"/>
    <div className={styles.previewBanner}><span className={styles.previewBannerMark}>make it yours</span></div>
    <div className={styles.previewBody}>
      <div className={styles.previewAvatar}>U</div>
      <div className={styles.previewName}>Your name <span>✦</span></div>
      <p>One place for everything you want people to find.</p>
      <div className={styles.previewLink}><Link2 size={17} /><span>Your links</span><ArrowUpRight size={16} /></div>
      <div className={styles.previewLink}><Palette size={17} /><span>Your creativity</span><ArrowUpRight size={16} /></div>
      <div className={styles.previewLink}><MessageCircle size={17} /><span>Get in touch</span><ArrowUpRight size={16} /></div>
    </div>
  </div>}
  <div className={styles.previewNote}><Sparkles size={16} /><span>{profile ? 'Your page, your way.' : 'One link. A whole world behind it.'}</span></div>
</div>;
};

const FEATURES = [
  { icon: Palette, number: '01', title: 'Look like you', body: 'Make the first impression yours with a profile that has room for your style, story and personality.', route: 'editor', action: 'Shape your page' },
  { icon: Link2, number: '02', title: 'Keep every link together', body: 'Put the places that matter in one easy-to-share address, so nobody has to search for the next step.', route: 'editor', action: 'Manage your links' },
  { icon: Sparkles, number: '03', title: 'Share your personality', body: 'Bring your page to life with music, custom backgrounds and the details that make it unmistakably yours.', route: 'editor', action: 'Make it yours' },
  { icon: BarChart3, number: '04', title: 'Know what gets noticed', body: 'See page views and link activity in your workspace, then make your page better over time.', route: 'overview', action: 'View your insights' },
];

export default function Home() {
  const { user } = useStore();
  const [topProfiles, setTopProfiles] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    let timer;
    let pool = [];
    const refresh = async () => {
      try {
        const response = await fetch('/api/top-profiles');
        if (!response.ok) throw new Error('Top profiles unavailable');
        const data = await response.json();
        if (Array.isArray(data.profiles)) pool = data.profiles.slice(0, 100);
      } catch { /* Keep the previous ranking when a refresh fails. */ }
      if (!active) return;
      if (pool.length) setTopProfiles((current) => {
        let next = pickProfiles(pool);
        const previous = new Set((current || []).map((profile) => profile.username));
        if (pool.length > 3 && next.every((profile) => previous.has(profile.username))) next = pickProfiles(pool);
        return next;
      });
      timer = window.setTimeout(refresh, rotationDelay());
    };
    refresh();
    return () => { active = false; clearTimeout(timer); };
  }, []);

  const copyPage = async () => {
    if (!user?.username) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/${user.username}`); setCopied(true); window.setTimeout(() => setCopied(false), 2200); }
    catch { setCopied(false); }
  };
  const slots = topProfiles || [null, null, null];

  return <div className={styles.home}>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <SiteKicker className={styles.eyebrow}>Your corner of the internet</SiteKicker>
        <h1 data-testid="hero-title">One link.<br /><em>Everything you do.</em></h1>
        <p className={styles.heroDescription}>Your link-in-bio page should do more than list URLs. Put your profile, links and music together in a place people actually want to open.</p>
        <div className={styles.heroActions}>
          {user ? <>
            <SiteAction to="/dashboard" data-testid="hero-cta" className={styles.primaryButton}>Open your workspace <ArrowRight size={17} /></SiteAction>
            <SiteAction to={`/${user.username}`} data-testid="hero-explore" className={styles.secondaryButton} variant="secondary">View your page <ArrowUpRight size={17} /></SiteAction>
          </> : <>
            <SiteAction to="/explore" data-testid="hero-cta" className={styles.primaryButton}>Explore pages <ArrowRight size={17} /></SiteAction>
            <SiteAction to="/login" data-testid="hero-explore" className={styles.secondaryButton} variant="secondary">Sign in <ArrowUpRight size={17} /></SiteAction>
          </>}
        </div>
        <div className={styles.heroAside}>{user ? <span>Your page is live at <strong>user.pet/{user.username}</strong></span> : <span>Creating a page is currently limited to invited accounts. <a href="https://discord.gg/upet" target="_blank" rel="noreferrer">Join the community for updates <ArrowUpRight size={13} /></a></span>}</div>
      </div>
      <HeroPreview user={user} />
    </section>

    <section className={styles.valueStrip} aria-label="What your page brings together">
      <span>One address</span><span>·</span><span>Your look</span><span>·</span><span>Your links</span><span>·</span><span>Your music</span><span>·</span><span>Your next conversation</span>
    </section>

    <section className={styles.showcase} aria-labelledby="showcase-title">
      <div className={styles.sectionHeader}><div><p className={styles.sectionKicker}>Made on user.pet</p><h2 id="showcase-title">Pages with their own point of view.</h2><p>Open a real page and see how much can live behind one link.</p></div><Link to="/explore" className={styles.textLink}>Explore all profiles <ArrowUpRight size={16} /></Link></div>
      <div className={styles.profileGrid}>{slots.map((entry, index) => <div key={entry?.username || `empty-${index}`}>{entry ? <TopProfile entry={entry} slot={index + 1} /> : <ProfilePlaceholder />}</div>)}</div>
      <p className={styles.showcaseNote}><Eye size={14} /> Three profiles picked from the top 100 · rotates every 3–5 minutes</p>
    </section>

    <section className={styles.featureSection} aria-labelledby="features-title">
      <div className={styles.featureLead}><p className={styles.sectionKicker}>Built for more than a bio</p><h2 id="features-title">Make every visit lead somewhere.</h2><p>A good page introduces you quickly, shows what you do, and gives people a clear way forward. Build it your way and keep the whole thing at one URL.</p>{user ? <Link to="/dashboard/editor" className={styles.textLink}>Customize your page <ArrowUpRight size={16} /></Link> : <Link to="/explore" className={styles.textLink}>See what people are building <ArrowUpRight size={16} /></Link>}</div>
      <div className={styles.featureGrid}>{FEATURES.map(({ icon: Icon, number, title, body, route, action }, index) => <div key={number} data-testid={`feature-${index}`} className={styles.featureCard}><div className={styles.featureCardTop}><span className={styles.featureIcon}><Icon size={20} /></span><span>{number}</span></div><h3>{title}</h3><p>{body}</p>{user && <Link to={`/dashboard/${route}`} className={styles.featureAction}>{action}<ArrowUpRight size={15} /></Link>}</div>)}</div>
    </section>

    <section className={styles.discovery} aria-labelledby="discovery-title"><div className={styles.discoveryVisual}><div className={styles.discoveryOrbit}><LayoutTemplate size={36} /><span>user.pet/you</span></div><span className={styles.discoveryChipOne}><Link2 size={16} /> Links</span><span className={styles.discoveryChipTwo}><Palette size={16} /> Style</span><span className={styles.discoveryChipThree}><MessageCircle size={16} /> Contact</span></div><div className={styles.discoveryCopy}><p className={styles.sectionKicker}>More than a landing page</p><h2 id="discovery-title">A home for the things you share.</h2><p>Your profile can be the introduction. Your links take people further. Your music and style make it feel like you. Everything stays connected to the same memorable address.</p><div className={styles.discoveryActions}><Link to="/login" className={styles.primaryButton}>Open your workspace <ArrowRight size={17} /></Link><Link to="/explore" className={styles.textLink}>Browse profiles <ArrowUpRight size={16} /></Link></div></div></section>

    <section className={styles.finalSection} data-testid="the-end-section"><p className={styles.sectionKicker}>Your next move</p><h2>{user ? 'Your page is ready to grow with you.' : 'See what one link can become.'}</h2><p>{user ? 'Keep shaping your page, put your best links up front, and make it easier for people to find you.' : 'Take a look around. Discover profiles made by the user.pet community.'}</p><div className={styles.finalActions}>{user ? <><Link to="/dashboard" data-testid="end-cta" className={styles.primaryButton}>Open dashboard <ArrowRight size={17} /></Link><button type="button" onClick={copyPage} className={styles.secondaryButton}>{copied ? <><Check size={17} /> Link copied</> : <><Copy size={17} /> Copy your link</>}</button></> : <><Link to="/explore" data-testid="end-cta" className={styles.primaryButton}>Explore pages <ArrowRight size={17} /></Link><a href="https://discord.gg/upet" target="_blank" rel="noreferrer" className={styles.secondaryButton}>Join the community <ArrowUpRight size={17} /></a></>}</div></section>
  </div>;
}
