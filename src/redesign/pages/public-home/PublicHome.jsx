import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BarChart3, Check, CirclePlay, Eye, Layers3, Link2, LockKeyhole, Music2, Palette, Shuffle, Sparkles } from 'lucide-react';
import { DISCORD_INVITE_URL, SUPPORT_EMAIL_URL } from './homeCopy.js';
import styles from './PublicHome.module.css';

const GlassScene = lazy(() => import('./GlassScene.jsx'));
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,18}[a-z0-9])?$/;
const normalizeUsername = (value) => value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 20);

const STORY = [
  { key: 'editor', title: 'Make the page feel like you.', body: 'Type, colour and atmosphere change together—without asking you to become a designer.', icon: Palette },
  { key: 'depth', title: 'Give every part room to breathe.', body: 'Music, media and links arrive in layers, so the page feels composed instead of crowded.', icon: Layers3 },
  { key: 'analytics', title: 'Know what earns attention.', body: 'Useful signals stay legible: what people opened, what moved, and where they went next.', icon: BarChart3 },
];
const PRESETS = [
  { name: 'Ink', background: '#171121', accent: '#b5ff56', font: 'tight', effect: 'grain' },
  { name: 'Coral', background: '#211014', accent: '#ff6f61', font: 'serif', effect: 'glow' },
  { name: 'Mist', background: '#d9d2ed', accent: '#38155c', font: 'mono', effect: 'aurora' },
  { name: 'Night', background: '#09090d', accent: '#a897d7', font: 'tight', effect: 'none' },
];

function BrandMark({ className = '' }) {
  return <span className={`${styles.brand} ${className}`}><span className={styles.brandMark} aria-hidden="true"><i /><i /><i /></span><span>user.pet</span></span>;
}
function MagneticLink({ children, className = '', ...props }) {
  return <a className={`${styles.magnetic} ${className}`} data-magnetic="true" {...props}><span>{children}</span></a>;
}
function ProfileCard({ username, className = '', compact = false, style }) {
  return <article className={`${styles.profileCard} ${compact ? styles.profileCompact : ''} ${className}`} data-tilt="true" style={style}>
    <div className={styles.cardShine} /><div className={styles.profileBanner}><span>YOUR INTERNET / COMPOSED</span></div>
    <div className={styles.profileBody}><div className={styles.profileAvatar}>A</div><small>DESIGNER · MAKER</small><h2>Aria Vale</h2><p>Making quiet things for the loud internet.</p><div className={styles.profileUrl}>user.pet/<strong>{username || 'yourname'}</strong></div><div className={styles.profileLinks}><span><Sparkles /> Latest work <ArrowUpRight /></span><span><Link2 /> All my links <ArrowUpRight /></span><span><Music2 /> Current obsession <ArrowUpRight /></span></div></div>
  </article>;
}
function OrbitChips() {
  const labels = ['Now playing Afterimage', '+128 views today', 'New click: portfolio', 'Palette: violet, lime and coral', 'Effect: Aurora'];
  const chips = [
    <><span className={styles.playDot}><CirclePlay /></span><span><small>NOW PLAYING</small>Afterimage</span><i className={styles.equalizer}><b /><b /><b /><b /></i></>,
    <><Eye /><span><strong>+128</strong><small>views today</small></span><i className={styles.sparkline} /></>,
    <><Link2 /><span><small>NEW CLICK</small>portfolio↗</span></>,
    <><Palette /><i className={styles.paletteDots}><b /><b /><b /></i></>,
    <><Sparkles /><span><small>EFFECT</small>Aurora</span><i className={styles.miniSwitch} /></>,
  ];
  return <>{chips.map((chip, index) => <button type="button" className={styles.orbitChip} style={{ '--chip': index }} key={index} aria-label={index > 2 ? labels[index] : undefined}>{chip}</button>)}</>;
}
function StoryPhone({ active }) {
  return <div className={styles.storyPhone} data-story={STORY[active].key}><div className={styles.phoneTop}><BrandMark /><span>•••</span></div><div className={styles.phoneScene}><div className={styles.phoneAura} /><div className={styles.phoneAvatar}>A</div><strong>Aria Vale</strong><small>@aria</small><div className={styles.phoneMedia}><Music2 /><span>Afterimage<br /><small>Aria Vale</small></span><i><b /></i></div><div className={styles.phoneLink}>Latest work <ArrowUpRight /></div><div className={styles.phoneLink}>Field notes <ArrowUpRight /></div><div className={styles.phoneChart}><i /><i /><i /><i /><i /><i /><span>2.4k<br /><small>views</small></span></div></div><div className={styles.phoneDock}><span /><span /><span /></div></div>;
}
function InteractiveEditor() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const select = (updates) => setPreset((current) => ({ ...current, ...updates }));
  const shuffle = () => setPreset(PRESETS[(PRESETS.findIndex((item) => item.name === preset.name) + 1) % PRESETS.length]);
  return <div className={styles.editorComposition}>
    <div className={styles.editorPanel}><span className={styles.registration} aria-hidden="true">⌜</span><span className={styles.registrationB} aria-hidden="true">⌟</span><div className={styles.editorHeading}><BrandMark /><span>LIVE / LOCAL</span></div>
      <fieldset><legend>Palette</legend><div className={styles.swatches}>{PRESETS.map((item) => <button key={item.name} type="button" aria-label={`${item.name} palette`} aria-pressed={item.background === preset.background} onClick={() => setPreset(item)} style={{ '--swatch-bg': item.background, '--swatch-accent': item.accent }} />)}</div></fieldset>
      <fieldset><legend>Typeface</legend><div className={styles.segmented}>{[['tight', 'Tight'], ['serif', 'Serif'], ['mono', 'Mono']].map(([value, label]) => <button type="button" key={value} aria-pressed={preset.font === value} onClick={() => select({ font: value })}>{label}</button>)}</div></fieldset>
      <fieldset><legend>Surface effect</legend><div className={styles.effectGrid}>{[['grain', 'Grain'], ['glow', 'Glow'], ['aurora', 'Aurora'], ['none', 'Clean']].map(([value, label]) => <button type="button" key={value} aria-pressed={preset.effect === value} onClick={() => select({ effect: value })}>{label}<i /></button>)}</div></fieldset>
      <button type="button" className={styles.shuffle} onClick={shuffle}><Shuffle /> Shuffle the composition</button>
    </div>
    <div className={styles.editorPreview} style={{ '--preview-bg': preset.background, '--preview-accent': preset.accent }} data-font={preset.font} data-effect={preset.effect}><div className={styles.editorPreviewNoise} /><div className={styles.previewTop}><span>user.pet/aria</span><span>↗</span></div><div className={styles.previewIdentity}><div>A</div><small>DESIGNER · MAKER</small><h3>Aria Vale</h3><p>Making quiet things for the loud internet.</p></div><span className={styles.previewButton}>Latest work <ArrowUpRight /></span><span className={styles.previewButton}>Now playing <CirclePlay /></span></div>
  </div>;
}

export default function PublicHome() {
  const rootRef = useRef(null); const featureRef = useRef(null);
  const [username, setUsername] = useState('yourname'); const [sceneReady, setSceneReady] = useState(false); const [activeStory, setActiveStory] = useState(0);
  const valid = useMemo(() => USERNAME_PATTERN.test(username), [username]);
  useEffect(() => { const idle = window.requestIdleCallback ? window.requestIdleCallback(() => setSceneReady(true), { timeout: 1000 }) : window.setTimeout(() => setSceneReady(true), 180); return () => window.cancelIdleCallback ? window.cancelIdleCallback(idle) : window.clearTimeout(idle); }, []);
  useEffect(() => {
    const root = rootRef.current; if (!root) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; const coarse = window.matchMedia('(pointer: coarse)').matches;
    const state = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, dirty: true }; let frame = 0;
    const move = (event) => { state.tx = event.clientX; state.ty = event.clientY; state.dirty = true; request(); };
    const scroll = () => { state.dirty = true; request(); };
    const tick = () => { frame = 0; if (!state.dirty || document.hidden) return; state.x += (state.tx - state.x) * .14; state.y += (state.ty - state.y) * .14; root.style.setProperty('--cursor-x', `${state.x}px`); root.style.setProperty('--cursor-y', `${state.y}px`); const feature = featureRef.current; if (feature && innerWidth > 860) { const rect = feature.getBoundingClientRect(); const progress = Math.min(.999, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight))); setActiveStory(Math.min(2, Math.floor(progress * 3))); root.style.setProperty('--story-progress', progress.toFixed(3)); } state.dirty = Math.abs(state.tx - state.x) > .2 || Math.abs(state.ty - state.y) > .2; if (state.dirty) frame = requestAnimationFrame(tick); };
    const request = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const pointerOver = (event) => { const magnetic = event.target.closest('[data-magnetic]'); root.dataset.cursorActive = String(Boolean(event.target.closest('a,button,input'))); if (!magnetic || reduced || coarse) return; const rect = magnetic.getBoundingClientRect(); magnetic.style.setProperty('--mx', `${(event.clientX - rect.left - rect.width / 2) * .16}px`); magnetic.style.setProperty('--my', `${(event.clientY - rect.top - rect.height / 2) * .16}px`); };
    const pointerOut = (event) => { const el = event.target.closest('[data-magnetic]'); if (el) { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); } };
    root.addEventListener('pointermove', pointerOver); root.addEventListener('pointerout', pointerOut); if (!reduced && !coarse) window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('scroll', scroll, { passive: true }); request();
    return () => { cancelAnimationFrame(frame); root.removeEventListener('pointermove', pointerOver); root.removeEventListener('pointerout', pointerOut); window.removeEventListener('pointermove', move); window.removeEventListener('scroll', scroll); };
  }, []);
  useEffect(() => { const sections = [...document.querySelectorAll('[data-nav-section]')]; const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) document.querySelectorAll('[data-nav-link]').forEach((link) => link.toggleAttribute('data-active', link.getAttribute('href') === `#${entry.target.id}`)); }), { rootMargin: '-40% 0px -52%' }); sections.forEach((section) => observer.observe(section)); return () => observer.disconnect(); }, []);
  const claim = (event) => { event.preventDefault(); window.location.assign('/login?create=1'); };
  return <main className={styles.home} ref={rootRef}>
    <div className={styles.cursorGlow} aria-hidden="true" />
    <header className={styles.header}><a href="#top" className={styles.logoLink}><BrandMark /></a><nav aria-label="Primary navigation"><a data-nav-link href="#features">Features</a><a data-nav-link href="#editor">Editor</a><a data-nav-link href="#access">Access</a></nav><div className={styles.headerActions}><a href="/login">Log in</a><MagneticLink href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer" className={styles.headerCta}>Request access <ArrowUpRight /></MagneticLink></div></header>
    <section id="top" className={styles.hero} data-nav-section><div className={styles.heroGrid}><div className={styles.heroCopy}><p className={styles.kicker}><span /> YOUR INTERNET, COMPOSED</p><h1 aria-label="One link for everything you are."><span className={styles.revealWords}><i>One</i> <i>link</i> <i>for</i></span><em>{[...'everything you are.'].map((letter, index) => <span style={{ '--letter': index }} key={`${letter}-${index}`}>{letter === ' ' ? '\u00a0' : letter}</span>)}</em></h1><p className={styles.heroText}>Build a personal page that holds your links, work, music and identity—then share it everywhere.</p><form className={styles.claim} onSubmit={claim}><label htmlFor="home-username">Claim your username</label><div><span>user.pet/</span><input id="home-username" value={username} onChange={(event) => setUsername(normalizeUsername(event.target.value))} aria-describedby="username-help" /><span className={styles.validity} data-valid={valid}><Check /></span><button type="submit" disabled={!valid}>Claim it <ArrowRight /></button></div><small id="username-help">3–20 letters, numbers, dots, underscores or hyphens. Format check only.</small></form><p className={styles.inviteNote}><LockKeyhole /> Currently invite-only. Claiming a name takes you through the invite check before an account is created.</p></div><div className={styles.heroStage}><div className={styles.sceneFallback} aria-hidden="true"><i /><i /></div>{sceneReady && <Suspense fallback={null}><GlassScene /></Suspense>}<ProfileCard username={username} /><OrbitChips /></div></div></section>
    <div className={styles.marquee} aria-label="What user.pet brings together"><div>{[...Array(2)].flatMap((_, pass) => ['one memorable profile', 'every important link', 'music with atmosphere', 'insight that stays useful'].map((item) => <span key={`${pass}-${item}`}><i>✦</i>{item}</span>))}</div></div>
    <section id="features" ref={featureRef} className={styles.features} data-nav-section><div className={styles.featuresSticky}><div className={styles.storyCopy}><p className={styles.index}>0{activeStory + 1} / 03</p>{STORY.map((story, index) => <article key={story.key} data-active={index === activeStory}><story.icon /><h2>{story.title}</h2><p>{story.body}</p></article>)}<div className={styles.storyRail}><i style={{ '--active-story': activeStory }} /></div></div><div className={styles.phoneStage}><span className={styles.giantType} aria-hidden="true">DEPTH</span><StoryPhone active={activeStory} /><span className={styles.stageCaption}>SCROLL TO RECOMPOSE ↓</span></div></div><div className={styles.mobileStories}>{STORY.map((story, index) => <article key={story.key}><span>0{index + 1}</span><story.icon /><h2>{story.title}</h2><p>{story.body}</p><StoryPhone active={index} /></article>)}</div></section>
    <section className={styles.typeMoment} aria-label="A statement about identity"><p><span>Your</span> <span>page</span> <span>should</span> <em><span>move</span> <span>like</span> <span>you</span> <span>do.</span></em></p></section>
    <section id="editor" className={styles.editorSection} data-nav-section><div className={styles.editorIntro}><p className={styles.kicker}><span /> DESIGNED WHILE YOU WATCH</p><h2>Make it yours<br /><em>in real time.</em></h2><p>Try the controls. Every change below stays in this page—no account, no save, no disconnected settings.</p></div><InteractiveEditor /></section>
    <section className={styles.lightSection}><span className={styles.lightCrop} aria-hidden="true">COMPOSED</span><div><p>BUILT WITH RESTRAINT</p><h2>Expressive doesn’t<br />have to mean noisy.</h2></div><div className={styles.lightNotes}><article><span>01</span><h3>Fast by default.</h3><p>The atmosphere arrives after the page. The content never waits for a canvas.</p></article><article><span>02</span><h3>Yours at every width.</h3><p>One composition, adapted for the pocket, the tablet and the big screen.</p></article><article><span>03</span><h3>Motion with manners.</h3><p>Every animated layer steps aside when reduced motion is preferred.</p></article></div></section>
    <section id="access" className={styles.finalCta} data-nav-section><div className={styles.ctaOrb} aria-hidden="true"><BrandMark /></div><p>YOUR NAME IS THE BEGINNING</p><h2>Give everything you do<br /><em>one place to land.</em></h2><MagneticLink href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer" className={styles.primaryCta}>Start with your invite <ArrowRight /></MagneticLink></section>
    <footer className={styles.footer}><div><a href="#top"><BrandMark /></a><p>One composed link for everything<br />you are and everything you make.</p></div><div><strong>Product</strong><a href="#features">Features</a><a href="#editor">Editor</a><a href="/login">Log in</a></div><div><strong>Legal</strong><a href="https://help.user.pet/legal/terms">Terms</a><a href="/privacy">Privacy</a></div><div><strong>Contact</strong><a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer">Community</a><a href={SUPPORT_EMAIL_URL}>Email</a></div><small>© 2026 user.pet</small><small>Built for expressive people.</small></footer>
  </main>;
}
