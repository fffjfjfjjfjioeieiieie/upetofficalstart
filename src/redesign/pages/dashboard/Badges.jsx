import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useStore } from "../../lib/store";
import { BADGES } from "../../lib/catalog";
import { BadgeIcon } from "../../components/ProfileBits";
import { Switch } from "../../components/ui/switch";
import { PageTitle } from "../../components/Controls";

export default function Badges() {
  const { user, setProfile } = useStore();
  const p = user.profile;
  const shown = p.shownBadges || [];
  const toggle = (id, on) => setProfile("shownBadges", on ? [...shown, id] : shown.filter((b) => b !== id));
  return (
    <div data-testid="badges-page">
      <PageTitle title="Badges" sub="Show off what you've earned. Toggle which ones appear on your page." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {BADGES.map((b, i) => {
          const owned = p.badges.includes(b.id);
          return (
            <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }} data-testid={`badge-card-${b.id}`} className={`glass rounded-2xl p-5 ${owned ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between">
                <BadgeIcon id={b.id} size={22} />
                {owned ? <Switch data-testid={`badge-toggle-${b.id}`} checked={shown.includes(b.id)} onCheckedChange={(v) => toggle(b.id, v)} /> : <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="mt-4 font-semibold">{b.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{b.desc}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
