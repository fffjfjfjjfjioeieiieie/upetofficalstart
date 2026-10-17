import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, X, Loader2, Palette, ShoppingBag, BarChart3 } from "lucide-react";
import { useStore } from "../lib/store";

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
        <div className="mt-16 grid gap-6 md:grid-cols-3">{[0, 1, 2].map((i) => <EmptyBio key={i} i={i} />)}</div>
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
