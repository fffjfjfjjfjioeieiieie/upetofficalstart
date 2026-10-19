import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Loader2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { getPublicRedesign } from '../lib/firebaseStore';
import { ProfileScene, ProfileCard } from '../components/ProfileCard';
import { FxText } from '../components/ProfileBits';
import { verifyEntryPassword } from '../lib/entryPassword';
import { Logo } from '../components/Logo';

function EntryGate({ entry, accent, onEnter }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const mode = entry?.mode === 'password' && entry.passwordHash && entry.passwordSalt ? 'password' : entry?.mode === 'anywhere' ? 'anywhere' : 'button';
  const title = entry?.title || 'click to enter';
  const checkPassword = async (event) => {
    event.preventDefault();
    setChecking(true);
    try {
      if (await verifyEntryPassword(password, entry)) onEnter();
      else { setError('That password is incorrect.'); setPassword(''); }
    } catch { setError('Could not check that password. Try again.'); }
    finally { setChecking(false); }
  };

  return <div data-testid="profile-entry-screen" className={`absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center ${mode === 'anywhere' ? 'cursor-pointer' : ''}`} onClick={mode === 'anywhere' ? onEnter : undefined} onKeyDown={mode === 'anywhere' ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onEnter(); } } : undefined} role={mode === 'anywhere' ? 'button' : undefined} tabIndex={mode === 'anywhere' ? 0 : undefined} aria-label={mode === 'anywhere' ? 'Click anywhere to enter profile' : undefined}>
    <div className="max-w-xl text-2xl font-black text-white sm:text-4xl" style={{ textShadow: `0 0 32px ${accent}99` }}><FxText fx={entry?.textEffect || 'none'} text={title} /></div>
    {entry?.subtitle && <p className="max-w-md text-sm text-white/75">{entry.subtitle}</p>}
    {mode === 'password' ? <form onSubmit={checkPassword} onClick={(event) => event.stopPropagation()} className="flex w-full max-w-xs flex-col gap-3"><label className="text-xs font-medium uppercase tracking-widest text-white/70" htmlFor="profile-entry-password">Password</label><input id="profile-entry-password" data-testid="profile-entry-password" type="password" autoComplete="off" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} className="rounded-xl border border-white/25 bg-black/50 px-4 py-3 text-center text-white outline-none focus:border-white" /><button data-testid="profile-enter" disabled={checking} className="rounded-xl px-5 py-3 text-sm font-bold text-black disabled:opacity-50" style={{ background: accent }}>{checking ? 'Checking…' : 'Enter profile'}</button>{error && <p role="alert" className="text-sm text-red-300">{error}</p>}</form> : mode === 'button' ? <button data-testid="profile-enter" onClick={onEnter} className="rounded-xl border border-white/30 bg-black/30 px-6 py-3 text-sm font-bold tracking-wider text-white transition-colors hover:bg-white/15">Enter profile</button> : null}
  </div>;
}

export default function ProfilePage() {
  const { username = '' } = useParams();
  const normalized = username.toLowerCase();
  const { db, recordView } = useStore();
  const [profile, setProfile] = useState(() => db.users[normalized]?.profile || null);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const viewRecorded = useRef('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setEntered(false);
    getPublicRedesign(normalized).then((result) => {
      if (!active) return;
      setProfile(result);
      setLoading(false);
      if (result && viewRecorded.current !== normalized) {
        viewRecorded.current = normalized;
        recordView(normalized);
      }
    }).catch(() => {
      if (active) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [normalized, recordView]);

  const cursorSrc = profile?.media.cursor?.src;
  useEffect(() => {
    if (!cursorSrc) return undefined;
    document.body.dataset.pcursor = '1';
    return () => { delete document.body.dataset.pcursor; };
  }, [cursorSrc]);

  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!profile) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" data-testid="profile-not-found">
      <h1 className="font-display text-4xl font-black"><span className="text-3d inline-block">user.pet/{username}</span></h1>
      <p className="text-muted-foreground">This username is unclaimed.</p>
      <Link to="/" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Go home</Link>
    </div>
  );

  const onMove = (event) => {
    if (!profile.card.tilt) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({ x: ((event.clientY - rect.top) / rect.height - 0.5) * -8, y: ((event.clientX - rect.left) / rect.width - 0.5) * 8 });
  };

  return (
    <div className="fixed inset-0 z-0" data-testid="profile-page" onMouseMove={onMove} style={cursorSrc ? { cursor: `url(${cursorSrc}) 16 16, auto` } : undefined}>
      {entered && profile.card.layout === 'slideshow' ? <ProfileScene p={profile} className="h-full w-full" /> : <ProfileScene p={profile} className="h-full w-full">
        {!entered ? (
          <EntryGate key={normalized} entry={profile.entry} accent={profile.card.accent} onEnter={() => setEntered(true)} />
        ) : (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }} className="w-full" style={{ perspective: 1000 }}>
            <div style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: 'transform .15s ease-out' }}>
              <ProfileCard p={profile} />
            </div>
          </motion.div>
        )}
      </ProfileScene>}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 text-xs text-white/60"><Eye className="h-3.5 w-3.5" />{profile.views}</div>
      <Link to="/" className="absolute bottom-3 right-4 z-20 text-white/70"><Logo className="scale-75" /></Link>
    </div>
  );
}
