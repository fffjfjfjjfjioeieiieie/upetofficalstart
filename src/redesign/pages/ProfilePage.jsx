import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Loader2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { getPublicRedesign } from '../lib/firebaseStore';
import { ProfileScene, ProfileCard } from '../components/ProfileCard';
import EntryGate from '../components/EntryGate';
import { Logo } from '../components/Logo';

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
