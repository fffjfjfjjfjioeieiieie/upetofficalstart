import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BarChart3, Check, Copy, Crown, Eye, LayoutTemplate, Link2, MessageCircle, Palette, ShoppingBag, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar, BadgeIcon, isVideoMedia } from '../components/ProfileBits';
import BusinessProgram from '../components/BusinessProgram';
import styles from './Home.module.css';

const reveal = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.18 }, transition: { duration: 0.5 } };
const stillImage = (media) => media?.src && !isVideoMedia(media) ? media.src : '';

const TopProfile = ({ entry, rank }) => {
  const accent = entry.card.accent;
  const image = stillImage(entry.banner) || stillImage(entry.background);
  return <Link to={`/${entry.username}`} data-testid={`top-profile-${rank}`} aria-label={`View ${entry.displayName}'s profile, rank ${rank}`} className={styles.profileCard} style={{ '--profile-accent': accent, '--profile-bg': entry.card.bgColor }}>
    <div className={styles.profileImage} style={image ? { backgroundImage: `linear-gradient(180deg, transparent 10%, ${entry.card.bgColor} 100%), url(${image})` } : undefined} />
    <div className={styles.profileContent}>
      <div className={styles.profileTopline}><span>{rank === 1 && <Crown size={13} />} #{rank} all time</span><ArrowUpRight size={17} /></div>
      <div className={styles.profileAvatar}><Avatar media={entry.avatar} name={entry.username} size={76} /></div>
      <h3>{entry.displayName}</h3>
      <p className={styles.profileHandle}>@{entry.username}{entry.alias && entry.alias !== entry.username ? ` · ${entry.alias}` : ''}</p>
      <div className={styles.profileBadges}>{entry.badges.slice(0, 2).map((badge) => <BadgeIcon key={badge} id={badge} size={11} />)}</div>
      <p className={styles.profileBio}>{entry.bio || 'Take a look at this page.'}</p>
      <div className={styles.profileBottom}><span><Eye size={14} />{entry.views.toLocaleString()} views</span><span><Link2 size={14} />{entry.linkCount} links</span></div>
    </div>
  </Link>;
};

const ProfilePlaceholder = ({ rank }) => <div className={styles.profilePlaceholder} aria-hidden="true"><span>#{rank}</span><div className={styles.placeholderAvatar} /><div className={styles.placeholderLine} /><div className={styles.placeholderLineShort} /><div className={styles.placeholderButton} /></div>;

export const HeroPreview = ({ user }) => {
  const profile = user?.profile;
  const banner = stillImage(profile?.media?.banner) || stillImage(profile?.media?.background);
  const links = profile?.links?.slice(0, 3) || [];
  const hasShop = Boolean(profile?.shop?.enabled);
  const rows = links.slice(0, hasShop ? 2 : 3);
  const previewStyle = profile ? {
    '--preview-accent': profile.card?.accent || '#6cc4ff',
    '--preview-background': profile.card?.bgColor || '#07111f',
    '--preview-surface': profile.card?.cardColor || '#0b1626',
    '--preview-text': profile.card?.textColor || '#ffffff',
  } : undefined;

  return <div className={styles.heroVisual} aria-label={profile ? `Preview of ${user.username}'s profile` : 'Illustrative user.pet profile preview'} data-testid="hero-profile-preview" style={previewStyle}>
  <div className={styles.previewHalo} />
  {profile ? <Link to={`/${user.username}`} className={`${styles.previewWindow} ${styles.userPreviewWindow}`} aria-label={`Open your profile at user.pet/${user.username}`}>
    <div className={styles.previewBar}><span className={styles.previewDots}><i /><i /><i /></span><span>user.pet/{user.username}</span><ArrowUpRight size={15} /></div>
    <div className={`${styles.previewBanner} ${styles.userPreviewBanner}`} style={banner ? { backgroundImage: `linear-gradient(180deg, transparent, ${profile.card?.bgColor || '#07111f'}88), url(${banner})` } : undefined} />
    <div className={styles.previewBody}>
      <div className={styles.userPreviewAvatar}><Avatar media={profile.media?.avatar} name={user.username} size={76} /></div>
      <div className={styles.previewName}>{profile.displayName || user.username}</div>
      <div className={styles.userPreviewHandle}>@{user.username}</div>
      {profile.bio && <p className={styles.userPreviewBio}>{profile.bio}</p>}
      <div className={styles.userPreviewRows}>
        {rows.map((link) => <div className={styles.previewLink} key={link.id || link.url}><Link2 size={17} /><span>{link.label || link.platform || 'Link'}</span><ArrowUpRight size={16} /></div>)}
        {hasShop && <div className={styles.previewLink}><ShoppingBag size={17} /><span>{profile.shop.name || 'Shop'}</span><ArrowUpRight size={16} /></div>}
        {!rows.length && !hasShop && <div className={styles.userPreviewEmpty}>Add your first link to bring your page to life.</div>}
      </div>
    </div>
  </Link> : <div className={styles.previewWindow}>
    <div className={styles.previewBar}><span className={styles.previewDots}><i /><i /><i /></span><span>user.pet/yourname</span><ArrowUpRight size={15} /></div>
    <div className={styles.previewBanner}><span className={styles.previewBannerMark}>make it yours</span></div>
    <div className={styles.previewBody}>
      <div className={styles.previewAvatar}>U</div>
      <div className={styles.previewName}>Your name <span>✦</span></div>
      <p>One place for everything you want people to find.</p>
      <div className={styles.previewLink}><Link2 size={17} /><span>Your links</span><ArrowUpRight size={16} /></div>
      <div className={styles.previewLink}><ShoppingBag size={17} /><span>Your shop</span><ArrowUpRight size={16} /></div>
      <div className={styles.previewLink}><MessageCircle size={17} /><span>Get in touch</span><ArrowUpRight size={16} /></div>
    </div>
  </div>}
  <div className={styles.previewNote}><Sparkles size={16} /><span>{profile ? 'Your page, your way.' : 'One link. A whole world behind it.'}</span></div>
</div>;
};

const FEATURES = [
  { icon: Palette, number: '01', title: 'Look like you', body: 'Make the first impression yours with a profile that has room for your style, story and personality.', route: 'editor', action: 'Shape your page' },
  { icon: Link2, number: '02', title: 'Keep every link together', body: 'Put the places that matter in one easy-to-share address, so nobody has to search for the next step.', route: 'editor', action: 'Manage your links' },
  { icon: ShoppingBag, number: '03', title: 'Show what you offer', body: 'Give your work a home with a storefront, product details and a way for people to start a conversation.', route: 'shop', action: 'Set up your shop' },
  { icon: BarChart3, number: '04', title: 'Know what gets noticed', body: 'See page views and link activity in your workspace, then make your page better over time.', route: 'overview', action: 'View your insights' },
];

export default function Home() {
  const { user } = useStore();
  const [topProfiles, setTopProfiles] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/top-profiles');
        if (!response.ok) throw new Error('Top profiles unavailable');
        const data = await response.json();
        if (active) setTopProfiles(Array.isArray(data.profiles) ? data.profiles.slice(0, 3) : []);
      } catch { /* Keep the previous ranking when a refresh fails. */ }
    };
    refresh();
    const timer = window.setInterval(refresh, 300000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const copyPage = async () => {
    if (!user?.username) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/${user.username}`); setCopied(true); window.setTimeout(() => setCopied(false), 2200); }
    catch { setCopied(false); }
  };
  const slots = [topProfiles?.[1], topProfiles?.[0], topProfiles?.[2]];

  return <div className={styles.home}>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <motion.p {...reveal} className={styles.eyebrow}><span className={styles.eyebrowDot} />Your corner of the internet</motion.p>
        <motion.h1 {...reveal} data-testid="hero-title">One link.<br /><em>Everything you do.</em></motion.h1>
        <motion.p {...reveal} className={styles.heroDescription}>Your link-in-bio page should do more than list URLs. Put your profile, links and offers together in a place people actually want to open.</motion.p>
        <motion.div {...reveal} className={styles.heroActions}>
          {user ? <>
            <Link to="/dashboard" data-testid="hero-cta" className={styles.primaryButton}>Open your workspace <ArrowRight size={17} /></Link>
            <Link to={`/${user.username}`} data-testid="hero-explore" className={styles.secondaryButton}>View your page <ArrowUpRight size={17} /></Link>
          </> : <>
            <Link to="/explore" data-testid="hero-cta" className={styles.primaryButton}>Explore pages <ArrowRight size={17} /></Link>
            <Link to="/marketplace" data-testid="hero-explore" className={styles.secondaryButton}>Browse shops <ArrowUpRight size={17} /></Link>
          </>}
        </motion.div>
        <motion.div {...reveal} className={styles.heroAside}>{user ? <span>Your page is live at <strong>user.pet/{user.username}</strong></span> : <span>Creating a page is currently limited to invited accounts. <a href="https://discord.gg/upet" target="_blank" rel="noreferrer">Join the community for updates <ArrowUpRight size={13} /></a></span>}</motion.div>
      </div>
      <HeroPreview user={user} />
    </section>

    <section className={styles.valueStrip} aria-label="What your page brings together">
      <span>One address</span><span>·</span><span>Your look</span><span>·</span><span>Your links</span><span>·</span><span>Your offers</span><span>·</span><span>Your next conversation</span>
    </section>

    <section className={styles.showcase} aria-labelledby="showcase-title">
      <div className={styles.sectionHeader}><div><p className={styles.sectionKicker}>Made on user.pet</p><h2 id="showcase-title">Pages with their own point of view.</h2><p>Open a real page and see how much can live behind one link.</p></div><Link to="/explore" className={styles.textLink}>Explore all profiles <ArrowUpRight size={16} /></Link></div>
      <div className={styles.profileGrid}>{slots.map((entry, index) => <div key={entry?.username || `empty-${index}`} className={index === 1 ? styles.firstSlot : index === 0 ? styles.secondSlot : styles.thirdSlot}>{entry ? <TopProfile entry={entry} rank={index === 1 ? 1 : index === 0 ? 2 : 3} /> : <ProfilePlaceholder rank={index === 1 ? 1 : index === 0 ? 2 : 3} />}</div>)}</div>
      <p className={styles.showcaseNote}><Eye size={14} /> Ranked by all-time profile views · updates every five minutes</p>
    </section>

    <section className={styles.featureSection} aria-labelledby="features-title">
      <div className={styles.featureLead}><p className={styles.sectionKicker}>Built for more than a bio</p><h2 id="features-title">Make every visit lead somewhere.</h2><p>A good page introduces you quickly, shows what you do, and gives people a clear way forward. Build it your way and keep the whole thing at one URL.</p>{user ? <Link to="/dashboard/editor" className={styles.textLink}>Customize your page <ArrowUpRight size={16} /></Link> : <Link to="/explore" className={styles.textLink}>See what people are building <ArrowUpRight size={16} /></Link>}</div>
      <div className={styles.featureGrid}>{FEATURES.map(({ icon: Icon, number, title, body, route, action }, index) => <motion.div {...reveal} key={number} data-testid={`feature-${index}`} className={styles.featureCard}><div className={styles.featureCardTop}><span className={styles.featureIcon}><Icon size={20} /></span><span>{number}</span></div><h3>{title}</h3><p>{body}</p>{user && <Link to={`/dashboard/${route}`} className={styles.featureAction}>{action}<ArrowUpRight size={15} /></Link>}</motion.div>)}</div>
    </section>

    <BusinessProgram user={user} />

    <section className={styles.discovery} aria-labelledby="discovery-title"><div className={styles.discoveryVisual}><div className={styles.discoveryOrbit}><LayoutTemplate size={36} /><span>user.pet/you</span></div><span className={styles.discoveryChipOne}><Link2 size={16} /> Links</span><span className={styles.discoveryChipTwo}><ShoppingBag size={16} /> Shop</span><span className={styles.discoveryChipThree}><MessageCircle size={16} /> Contact</span></div><div className={styles.discoveryCopy}><p className={styles.sectionKicker}>More than a landing page</p><h2 id="discovery-title">A home for the things you share.</h2><p>Your profile can be the introduction. Your links take people further. Your shop gives your work a place to be seen. Everything stays connected to the same memorable address.</p><div className={styles.discoveryActions}><Link to="/marketplace" className={styles.primaryButton}>Explore the marketplace <ArrowRight size={17} /></Link><Link to="/explore" className={styles.textLink}>Browse profiles <ArrowUpRight size={16} /></Link></div></div></section>

    <section className={styles.finalSection} data-testid="the-end-section"><p className={styles.sectionKicker}>Your next move</p><h2>{user ? 'Your page is ready to grow with you.' : 'See what one link can become.'}</h2><p>{user ? 'Keep shaping your page, put your best links up front, and make it easier for people to find you.' : 'Take a look around. Discover profiles and storefronts made by the user.pet community.'}</p><div className={styles.finalActions}>{user ? <><Link to="/dashboard" data-testid="end-cta" className={styles.primaryButton}>Open dashboard <ArrowRight size={17} /></Link><button type="button" onClick={copyPage} className={styles.secondaryButton}>{copied ? <><Check size={17} /> Link copied</> : <><Copy size={17} /> Copy your link</>}</button></> : <><Link to="/explore" data-testid="end-cta" className={styles.primaryButton}>Explore pages <ArrowRight size={17} /></Link><a href="https://discord.gg/upet" target="_blank" rel="noreferrer" className={styles.secondaryButton}>Join the community <ArrowUpRight size={17} /></a></>}</div></section>
  </div>;
}
