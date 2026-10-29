import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BarChart3, Check, CircleUserRound, Layers3, Link2, MousePointerClick, Palette, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import styles from './Home.module.css';

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,19}$/;

function ClaimForm() {
  const { isTaken } = useStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('idle');
  const normalized = useMemo(() => username.trim().toLowerCase(), [username]);

  useEffect(() => {
    let active = true;
    if (!normalized) { setStatus('idle'); return undefined; }
    if (!USERNAME_PATTERN.test(normalized)) { setStatus('invalid'); return undefined; }
    setStatus('checking');
    const timer = window.setTimeout(async () => {
      try {
        const taken = await isTaken(normalized);
        if (active) setStatus(taken ? 'taken' : 'available');
      } catch {
        if (active) setStatus('error');
      }
    }, 450);
    return () => { active = false; window.clearTimeout(timer); };
  }, [isTaken, normalized]);

  const submit = (event) => {
    event.preventDefault();
    if (status !== 'available') return;
    navigate(`/login?mode=signup&claim=${encodeURIComponent(normalized)}&next=${encodeURIComponent('/claim')}`);
  };

  const message = {
    idle: '3–20 letters, numbers, dots, underscores or hyphens.',
    invalid: 'Choose at least three valid characters.',
    checking: 'Checking availability…',
    taken: 'That username is already claimed.',
    available: `user.pet/${normalized} is available.`,
    error: 'Availability could not be checked. Try again shortly.',
  }[status];

  return <form className={styles.claim} onSubmit={submit} aria-label="Claim your username">
    <label htmlFor="claim-username">Claim your username</label>
    <div className={styles.claimRow} data-status={status}>
      <span>user.pet/</span>
      <input id="claim-username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder="yourname" autoComplete="username" spellCheck="false" aria-describedby="claim-status" />
      <button type="submit" disabled={status !== 'available'}>Claim it <ArrowRight aria-hidden="true" /></button>
    </div>
    <p id="claim-status" className={styles.claimStatus} aria-live="polite">{status === 'available' && <Check aria-hidden="true" />}{message}</p>
  </form>;
}

function ProfilePreview() {
  return <div className={styles.previewStage} aria-label="Example user.pet profile preview">
    <span className={styles.previewOrbOne} aria-hidden="true" />
    <span className={styles.previewOrbTwo} aria-hidden="true" />
    <article className={styles.previewCard}>
      <div className={styles.previewChrome}><i /><i /><i /><span>user.pet/aria</span></div>
      <div className={styles.previewCover} aria-hidden="true"><span /><span /><span /></div>
      <div className={styles.previewContent}>
        <div className={styles.previewAvatar}>A</div>
        <p className={styles.previewKicker}>Designer · maker</p>
        <h2>Aria Vale</h2>
        <p>Making quiet things for the loud internet.</p>
        <a href="#features" onClick={(event) => event.preventDefault()}><Palette aria-hidden="true" /> Latest work <ArrowUpRight aria-hidden="true" /></a>
        <a href="#features" onClick={(event) => event.preventDefault()}><Link2 aria-hidden="true" /> All my links <ArrowUpRight aria-hidden="true" /></a>
        <a href="#features" onClick={(event) => event.preventDefault()}><Sparkles aria-hidden="true" /> Current obsession <ArrowUpRight aria-hidden="true" /></a>
      </div>
    </article>
    <span className={styles.previewBadge}><span /> Live profile preview</span>
  </div>;
}

const FEATURES = [
  { icon: Palette, eyebrow: 'Editor', title: 'A profile that feels like you.', copy: 'Shape every detail with custom cards, typography, backgrounds, motion and effects—without touching code.' },
  { icon: Layers3, eyebrow: 'Creative system', title: 'Depth without the noise.', copy: 'Layer media, music and expressive details into a page that stays clear, fast and distinctly yours.' },
  { icon: BarChart3, eyebrow: 'Analytics', title: 'Know what earns attention.', copy: 'See real views and clicks in one calm dashboard, with clean empty states while your audience grows.' },
];

export default function Home() {
  const { user } = useStore();
  return <div className={styles.home}>
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span /> Your internet, composed</p>
        <h1 id="home-title" data-testid="hero-title">One link for<br /><em>everything you are.</em></h1>
        <p className={styles.heroText}>Build a personal page that holds your links, work, music and identity—then share it everywhere.</p>
        {user ? <div className={styles.signedInActions}><Link to="/dashboard" className={styles.primaryCta}>Go to dashboard <ArrowRight /></Link><Link to={`/${user.username}`} className={styles.secondaryCta}>View your profile <ArrowUpRight /></Link></div> : <ClaimForm />}
        {!user && <p className={styles.inviteNote}>Currently invite-only. Claiming a name takes you through the invite check before an account is created.</p>}
      </div>
      <ProfilePreview />
    </section>

    <section className={styles.signalStrip} aria-label="Platform highlights">
      <span><CircleUserRound /> One memorable profile</span><span><Link2 /> Every important link</span><span><MousePointerClick /> Insight that stays useful</span>
    </section>

    <section className={styles.features} id="features" aria-labelledby="features-title">
      <div className={styles.sectionIntro}><p className={styles.eyebrow}>Built as a canvas</p><h2 id="features-title">More presence.<br />Less platform.</h2><p>user.pet gives your identity room to breathe, while keeping the tools you need close by.</p></div>
      <div className={styles.featureGrid}>{FEATURES.map(({ icon: Icon, eyebrow, title, copy }) => <article className={styles.featureCard} key={title}><span className={styles.featureIcon}><Icon /></span><p>{eyebrow}</p><h3>{title}</h3><span>{copy}</span></article>)}</div>
    </section>

    <section className={styles.editorStory} aria-labelledby="editor-title">
      <div className={styles.editorMock} aria-hidden="true"><div className={styles.editorRail}><i /><i /><i /><i /></div><div className={styles.editorFields}><span /><span /><span /><span /></div><div className={styles.editorPhone}><div /><i /><i /><i /></div></div>
      <div><p className={styles.eyebrow}>Designed while you watch</p><h2 id="editor-title">Make it yours in real time.</h2><p>Adjust your identity, links, backgrounds and effects beside a live preview. Every choice belongs to one coherent profile—not a pile of disconnected settings.</p><Link to={user ? '/dashboard/editor' : '/login'} className={styles.textLink}>{user ? 'Open the editor' : 'Explore the workspace'} <ArrowRight /></Link></div>
    </section>

    <section className={styles.comingSoon} aria-labelledby="soon-title"><div><p className={styles.eyebrow}>On the horizon</p><h2 id="soon-title">More ways to build around your audience.</h2></div><div className={styles.soonItems}><span>Shops <small>Coming soon</small></span><span>Donations <small>In development</small></span></div></section>

    <section className={styles.proofPlaceholder} aria-labelledby="community-title" data-optional-section="social-proof"><p className={styles.eyebrow}>Community</p><h2 id="community-title">Made for people with something to share.</h2><p>Creator stories will appear here as the community grows—without invented testimonials or vanity numbers.</p></section>

    <section className={styles.finalCta}><p className={styles.eyebrow}>Your name is the beginning</p><h2>Give everything you do<br />one place to land.</h2>{user ? <Link to="/dashboard" className={styles.primaryCta}>Go to dashboard <ArrowRight /></Link> : <Link to="/login?mode=signup" className={styles.primaryCta}>Start with your invite <ArrowRight /></Link>}</section>
  </div>;
}
