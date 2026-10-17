import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, Link2, Award, CalendarDays, CheckCircle2, Circle, Upload, Copy } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useStore, fileToDataUrl } from "../../lib/store";
import { Panel, Field, inputCls, PageTitle } from "../../components/Controls";
import { Avatar } from "../../components/ProfileBits";

const Stat = ({ icon: Icon, label, value, i }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass rounded-2xl p-5" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
    <div className="flex items-center justify-between text-xs text-muted-foreground">{label}<Icon className="h-4 w-4 text-primary" /></div>
    <div className="mt-3 font-display text-3xl font-black">{value}</div>
  </motion.div>
);

export default function Overview() {
  const { user, setProfile } = useStore();
  const nav = useNavigate();
  const file = useRef(null);
  const p = user.profile;
  const days = Math.max(1, Math.floor((Date.now() - user.createdAt) / 86400000));
  const tasks = [
    ["Upload a profile picture", !!p.media.avatar.src, "editor"],
    ["Write a bio", !!p.bio, "editor"],
    ["Add your first link", p.links.length > 0, "editor"],
    ["Add background audio", !!p.audio.src, "editor"],
    ["Pick an avatar decoration", !!p.effects.decoration, "editor"],
    ["Enable a widget", p.widgets.discord.enabled || p.widgets.tiktok.enabled, "editor"],
    ["Turn on 2FA", user.twofa.enabled, "settings"],
    ["Connect Discord", !!user.connections.discord, "settings"],
  ];
  const done = tasks.filter((t) => t[1]).length;
  const history = (p.viewHistory || []).map((h) => ({ day: h.day.slice(5), views: h.count }));
  const upload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      setProfile("media.avatar.src", await fileToDataUrl(f, 400, 'avatar'));
      setProfile("media.avatar.type", f.type.startsWith('video/') ? 'video' : 'image');
      toast.success("Profile picture updated");
    } catch (error) {
      toast.error(error?.message || 'Profile picture could not be uploaded');
    }
  };
  return (
    <div data-testid="overview-page">
      <PageTitle title={`Hey, ${p.alias}`} sub="Here is how your page is doing." />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat i={0} icon={Eye} label="Profile views" value={p.views} />
        <Stat i={1} icon={Link2} label="Links" value={p.links.length} />
        <Stat i={2} icon={Award} label="Badges" value={p.badges.length} />
        <Stat i={3} icon={CalendarDays} label="Days active" value={days} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Views" desc="Last 30 days" testid="overview-chart">
          <div className="h-56">
            {history.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6cc4ff" stopOpacity={0.6} /><stop offset="100%" stopColor="#6cc4ff" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.4} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />
                  <Area type="monotone" dataKey="views" stroke="#38aaff" strokeWidth={2} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="grid h-full place-items-center text-sm text-muted-foreground">No views yet — share your link.</div>}
          </div>
        </Panel>
        <Panel title="Suggestions" desc={`${done}/${tasks.length} complete`} testid="overview-suggestions">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-primary/15"><motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(done / tasks.length) * 100}%` }} /></div>
          <ul className="space-y-1">
            {tasks.map(([t, ok, to], i) => (
              <li key={t}>
                <button data-testid={`suggestion-${i}`} onClick={() => nav(`/dashboard/${to}`)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-primary/10">
                  {ok ? <CheckCircle2 className="h-4 w-4 fill-emerald-500 text-white dark:text-background" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <span className={ok ? "text-muted-foreground line-through" : ""}>{t}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Basics" className="mt-4" testid="overview-basics">
        <div className="grid gap-6 md:grid-cols-[auto_1fr_1fr]">
          <div className="flex flex-col items-center gap-3">
            <Avatar media={p.media.avatar} name={p.username} size={84} decoration={p.effects.decoration} hue={p.effects.decoHue} decoSize={p.effects.decoSize} />
            <input ref={file} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" hidden onChange={upload} />
            <button data-testid="overview-upload-pfp" onClick={() => file.current.click()} className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-primary/30"><Upload className="h-3.5 w-3.5" />Upload pfp</button>
          </div>
          <div className="space-y-3">
            <Field label="Alias"><input data-testid="overview-alias" className={inputCls} value={p.alias} onChange={(e) => setProfile("alias", e.target.value)} /></Field>
            <Field label="Display name"><input data-testid="overview-display-name" className={inputCls} value={p.displayName} onChange={(e) => setProfile("displayName", e.target.value)} /></Field>
          </div>
          <div className="space-y-3">
            <Field label="Bio"><textarea data-testid="overview-bio" rows={3} className={inputCls} value={p.bio} onChange={(e) => setProfile("bio", e.target.value)} /></Field>
            <button data-testid="overview-copy-link" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/${p.username}`); toast.success("Link copied"); }} className="flex items-center gap-2 text-xs text-primary"><Copy className="h-3.5 w-3.5" />{window.location.host}/{p.username}</button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
