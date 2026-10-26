import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Eye } from "lucide-react";
import { useStore } from "../lib/store";
import { Avatar, BadgeIcon } from "../components/ProfileBits";

export default function Explore() {
  const { db, refreshDirectory } = useStore();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    refreshDirectory().then(() => { if (active) setError(''); })
      .catch((reason) => { if (active) setError(reason?.message || 'Profiles could not load.'); });
    return () => { active = false; };
  }, [refreshDirectory]);
  const [q, setQ] = useState("");
  const users = useMemo(() => Object.values(db.users).filter((u) => !u.banned && (u.username + u.profile.alias).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.profile.views - a.profile.views), [db, q]);
  return (
    <section className="mx-auto max-w-6xl px-6" data-testid="explore-page">
      <h1 className="font-display text-4xl font-black sm:text-5xl lg:text-6xl"><span className="text-3d inline-block">Explore</span></h1>
      <p className="mt-4 text-base text-muted-foreground">Discover pages from the user.pet community.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
      <div className="glass mt-8 flex max-w-md items-center gap-2 rounded-full px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input data-testid="explore-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" className="flex-1 bg-transparent text-sm outline-none" />
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u, i) => (
          <motion.div key={u.username} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -6 }}>
            <Link to={`/${u.username}`} data-testid={`explore-user-${u.username}`} className="glass flex items-center gap-4 rounded-3xl p-5">
              <Avatar media={u.profile.media.avatar} name={u.username} size={56} decoration={u.profile.effects.decoration} hue={u.profile.effects.decoHue} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate font-semibold">{u.profile.displayName}{(u.profile.shownBadges || []).slice(0, 2).map((b) => <BadgeIcon key={b} id={b} size={11} />)}</div>
                <div className="truncate text-xs text-muted-foreground">user.pet/{u.username}</div>
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3.5 w-3.5" />{u.profile.views}</span>
            </Link>
          </motion.div>
        ))}
        {!users.length && <div className="text-sm text-muted-foreground" data-testid="explore-empty">No users found.</div>}
      </div>
    </section>
  );
}
