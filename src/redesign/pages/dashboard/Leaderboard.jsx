import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Crown } from "lucide-react";
import { useStore } from "../../lib/store";
import { Avatar, BadgeIcon } from "../../components/ProfileBits";
import { PageTitle } from "../../components/Controls";

export default function Leaderboard() {
  const { db, user } = useStore();
  const rows = Object.values(db.users).filter((u) => !u.banned).sort((a, b) => b.profile.views - a.profile.views).slice(0, 50);
  return (
    <div data-testid="leaderboard-page">
      <PageTitle title="Leaderboard" sub="Most viewed pages on user.pet." />
      <div className="glass overflow-hidden rounded-2xl">
        {rows.map((u, i) => (
          <motion.div key={u.username} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <Link to={`/${u.username}`} data-testid={`leaderboard-row-${u.username}`} className={`flex items-center gap-4 border-b px-5 py-3.5 transition-colors last:border-0 hover:bg-primary/10 ${u.username === user.username ? "bg-primary/10" : ""}`}>
              <span className={`w-8 font-display text-lg font-black ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>{i === 0 ? <Crown className="h-5 w-5" /> : `#${i + 1}`}</span>
              <Avatar media={u.profile.media.avatar} name={u.username} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-semibold">{u.profile.displayName}{(u.profile.shownBadges || []).slice(0, 3).map((b) => <BadgeIcon key={b} id={b} size={11} />)}</div>
                <div className="text-xs text-muted-foreground">@{u.username}</div>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-sm"><Eye className="h-4 w-4 text-primary" />{u.profile.views}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
