import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, X, Loader2, Palette, ShoppingBag, BarChart3, Crown, Eye, Link2 } from "lucide-react";
import { useStore } from "../lib/store";
import { Avatar, BadgeIcon, isVideoMedia } from "../components/ProfileBits";

const fade = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

const EmptyBio = ({ i }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }} data-testid={`example-bio-${i}`} className="relative h-[380px] overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm" style={{ transform: `rotate(${[-2, 0, 2][i]}deg)` }}>
    <div className="flex h-full flex-col items-center gap-3 p-6 pt-12">
      <div className="h-24 w-24 rounded-full border border-dashed border-primary/30" />
      <div className="h-4 w-28 rounded-full bg-primary/10" />
      <div className="h-3 w-16 rounded-full bg-primary/5" />
      <div className="mt-6 h-14 w-full rounded-xl border border-dashed border-border" />
      <div className="mt-auto h-11 w-full rounded-xl border border-dashed border-border" />
    </div>
  </motion.div>
);

const stillImage = (media) => media?.src && !isVideoMedia(media) ? media.src : '';

const TopProfile = ({ entry, rank, slot }) => {
  const accent = entry.card.accent;
  const image = stillImage(entry.banner) || stillImage(entry.background);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + slot * 0.1, duration: 0.5 }} data-testid={`top-profile-${rank}`} className="group relative h-[380px] min-w-0 overflow-hidden rounded-2xl border shadow-xl transition-transform hover:-translate-y-1" style={{ backgroundColor: entry.card.bgColor, borderColor: `${accent}55` }}>
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-white/15 to-transparent" style={image ? { backgroundImage: `linear-gradient(to bottom, transparent, ${entry.card.bgColor}), url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35" />
      <Link to={`/${entry.username}`} aria-label={`View ${entry.displayName}'s profile, rank ${rank}`} className="relative flex h-full min-w-0 flex-col items-center p-5 text-center text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px]" style={{ outlineColor: accent }}>
        <div className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider"><span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2.5 py-1" style={{ color: accent }}>{rank === 1 ? <Crown className="h-3.5 w-3.5" /> : null}#{rank} all time</span><ArrowUpRight className="h-4 w-4 text-white/65 transition-colors group-hover:text-white" /></div>
        <div className="mt-5 rounded-full p-1 shadow-lg" style={{ backgroundColor: `${accent}55` }}><Avatar media={entry.avatar} name={entry.username} size={72} /></div>
        <h3 className="mt-3 w-full truncate font-display text-xl font-bold">{entry.displayName}</h3>
        <p className="w-full truncate text-xs text-white/60">@{entry.username}{entry.alias && entry.alias !== entry.username ? ` · ${entry.alias}` : ''}</p>
        <div className="mt-2 flex h-6 items-center justify-center gap-1">{entry.badges.slice(0, 2).map((badge) => <BadgeIcon key={badge} id={badge} size={11} />)}</div>
        <p className="mt-3 line-clamp-2 min-h-9 max-w-[250px] text-xs leading-relaxed text-white/70">{entry.bio || 'Take a look at this profile.'}</p>
        <div className="mt-auto flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-xs backdrop-blur-sm"><span className="inline-flex items-center gap-1.5 text-white/75"><Eye className="h-3.5 w-3.5" />{entry.views.toLocaleString()} views</span><span className="inline-flex items-center gap-1.5 text-white/60"><Link2 className="h-3.5 w-3.5" />{entry.linkCount}</span></div>
      </Link>
    </motion.div>
  );
};

const UsernameCheck = () => {
  const { isTaken } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [state, setState] = useState("idle");
  useEffect(() => {
    const n = name.toLowerCase().trim();
    if (!n) return setState("idle");
    if (!/^[a-z0-9][a-z0-9._-]{2,19}$/.test(n)) return setState("invalid");
    setState("checking");
    let active = true;
    const t = setTimeout(async () => {
      const taken = await isTaken(n);
      if (active) setState(taken ? "taken" : "available");
    }, 400);
    return () => { active = false; clearTimeout(t); };
  }, [name, isTaken]);
  const msg = { idle: "Type to check instantly", invalid: "2-20 chars: a-z, 0-9, _ or .", checking: "Checking…", taken: "Already taken", available: "Available" }[state];
  const color = state === "available" ? "text-emerald-400" : state === "taken" || state === "invalid" ? "text-red-400" : "text-muted-foreground";
  return (
    <motion.section {...fade} className="mx-auto mt-32 max-w-xl px-6 text-center" data-testid="username-check-section">
      <h2 className="text-2xl font-semibold sm:text-3xl">Check your username</h2>
      <div className="mt-6 flex items-center gap-2 rounded-xl border bg-card/70 p-1.5 pl-4 text-left">
        <span className="font-mono text-sm text-muted-foreground">user.pet/</span>
        <input data-testid="username-check-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="____" className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none" />
        <span className={color}>{state === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "available" ? <Check className="h-4 w-4" /> : state === "taken" || state === "invalid" ? <X className="h-4 w-4" /> : null}</span>
        <button data-testid="username-claim-button" disabled={state !== "available"} onClick={() => nav(`/claim?username=${name.toLowerCase().trim()}`)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40">Claim</button>
      </div>
      <div data-testid="username-check-status" className={`mt-2 text-xs ${color}`}>{msg}</div>
    </motion.section>
  );
};

const FEATURES = [[Palette, "Customize", "Layouts, effects, decorations and widgets."], [ShoppingBag, "Sell", "Run a shop right on your page."], [BarChart3, "Track", "Views and stats in your dashboard."]];

export default function Home() {
  const { user } = useStore();
  const [topProfiles, setTopProfiles] = useState(null);
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
  const slots = [topProfiles?.[1], topProfiles?.[0], topProfiles?.[2]];
  return (
    <div>
      <section className="mx-auto max-w-5xl px-6 pt-8 text-center">
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} data-testid="hero-title" className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Buy, Sell and Flex with your <span className="text-primary" style={{ textShadow: "0 0 24px hsl(var(--primary) / .45)" }}>user.pet</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mx-auto mt-5 max-w-md text-sm text-muted-foreground sm:text-base">
          {user ? 'One link for your links, your music and your shop.' : "user.pet is currently unavailable, but we're cooking. Join the Discord instead?"}
        </motion.p>
        <div className="mt-8 flex justify-center gap-3">
          {user ? <Link to="/dashboard" data-testid="hero-cta" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Dashboard<ArrowRight className="h-4 w-4" /></Link> : <a href="https://discord.gg/upet" target="_blank" rel="noreferrer" data-testid="hero-cta" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Join Discord<ArrowRight className="h-4 w-4" /></a>}
          {user && <Link to="/marketplace" data-testid="hero-explore" className="rounded-xl border bg-card/60 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-card">Marketplace</Link>}
        </div>
        <div className="mt-16"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Most viewed profiles</p><p className="mt-2 text-xs text-muted-foreground">All-time leaders · refreshes every 5 minutes</p></div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">{slots.map((entry, i) => <div key={entry?.username || `empty-${i}`} className={`${i === 1 ? 'order-1 md:order-2' : i === 0 ? 'order-2 md:order-1' : 'order-3'}`}>{entry ? <TopProfile entry={entry} rank={i === 1 ? 1 : i === 0 ? 2 : 3} slot={i} /> : <EmptyBio i={i} />}</div>)}</div>
      </section>
      {user && <UsernameCheck />}
      <section className="mx-auto mt-28 grid max-w-5xl gap-4 px-6 md:grid-cols-3">
        {FEATURES.map(([Icon, t, d], i) => (
          <motion.div key={t} {...fade} data-testid={`feature-${i}`} className="rounded-2xl border bg-card/60 p-6">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </motion.div>
        ))}
      </section>
      <motion.section {...fade} className="mx-auto mt-28 max-w-xl px-6 text-center" data-testid="the-end-section">
        <h2 className="text-3xl font-bold">Ready?</h2>
        <p className="mt-2 text-sm text-muted-foreground">{user ? 'Keep building your page.' : 'Follow development and release updates in Discord.'}</p>
        {user ? <Link to="/dashboard" data-testid="end-cta" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Open dashboard <ArrowRight className="h-4 w-4" /></Link> : <a href="https://discord.gg/upet" target="_blank" rel="noreferrer" data-testid="end-cta" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Join Discord <ArrowRight className="h-4 w-4" /></a>}
      </motion.section>
    </div>
  );
}
