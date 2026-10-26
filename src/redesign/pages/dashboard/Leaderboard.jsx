import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Crown, Loader2, RefreshCw } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Avatar, BadgeIcon } from '../../components/ProfileBits';
import { PageTitle } from '../../components/Controls';

export default function Leaderboard() {
  const { user } = useStore();
  const [rows, setRows] = useState([]);
  const [state, setState] = useState('loading');
  const load = async () => {
    setState('loading');
    try {
      const response = await fetch('/api/top-profiles');
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(result.profiles)) throw new Error(result.error || 'Leaderboard could not be loaded.');
      setRows(result.profiles.slice(0, 50));
      setState('ready');
    } catch { setState('error'); }
  };
  useEffect(() => { load(); }, []);
  return (
    <div data-testid="leaderboard-page">
      <PageTitle title="Leaderboard" sub="Most viewed published pages on user.pet. Rankings update about once an hour." />
      <div className="glass overflow-hidden rounded-2xl">
        {state === 'loading' && <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading real view totals…</div>}
        {state === 'error' && <div className="grid place-items-center gap-3 p-10 text-sm text-muted-foreground"><p>The leaderboard could not load.</p><button onClick={load} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-foreground hover:bg-primary/10"><RefreshCw className="h-4 w-4" />Try again</button></div>}
        {state === 'ready' && !rows.length && <p className="p-10 text-center text-sm text-muted-foreground">No published profile views yet.</p>}
        {state === 'ready' && rows.map((entry, index) => (
          <motion.div key={entry.username} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.025, 0.4) }}>
            <Link to={`/${entry.username}`} data-testid={`leaderboard-row-${entry.username}`} className={`flex items-center gap-4 border-b px-5 py-3.5 transition-colors last:border-0 hover:bg-primary/10 ${entry.username === user.username ? 'bg-primary/10' : ''}`}>
              <span className={`w-8 font-display text-lg font-black ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>{index === 0 ? <Crown className="h-5 w-5" /> : `#${index + 1}`}</span>
              <Avatar media={entry.avatar} name={entry.username} size={40} />
              <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5 font-semibold">{entry.displayName}{(entry.badges || []).slice(0, 3).map((badge) => <BadgeIcon key={badge} id={badge} size={11} />)}</div><div className="text-xs text-muted-foreground">@{entry.username}</div></div>
              <span className="flex items-center gap-1.5 font-mono text-sm"><Eye className="h-4 w-4 text-primary" />{Number(entry.views || 0).toLocaleString()}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
