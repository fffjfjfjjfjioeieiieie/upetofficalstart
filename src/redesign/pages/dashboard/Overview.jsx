import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Circle, Copy, Eye, ExternalLink, Image, Link2, MousePointerClick, Palette, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../lib/store';

const number = new Intl.NumberFormat('en-GB');

function StatCard({ icon: Icon, label, value, detail, loading }) {
  return <article className="glass rounded-2xl p-5">{loading ? <><div className="h-3 w-24 animate-pulse rounded-full bg-foreground/10" /><div className="mt-4 h-8 w-20 animate-pulse rounded-lg bg-primary/15" /><div className="mt-3 h-2 w-32 animate-pulse rounded-full bg-foreground/[.06]" /></> : <><div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>{label}</span><Icon className="h-4 w-4 text-primary" /></div><strong className="mt-3 block font-display text-3xl tracking-tight">{value}</strong><p className="mt-2 text-xs text-muted-foreground">{detail}</p></>}</article>;
}

export default function Overview() {
  const { user, refreshProfileAnalytics } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const profile = user.profile;
  const profileUrl = `${window.location.origin}/${user.username}`;

  const refresh = useCallback(async () => {
    setLoading(true);
    try { await refreshProfileAnalytics(); setError(''); }
    catch (exception) { setError(exception?.message || 'Analytics could not be loaded.'); }
    finally { setLoading(false); }
  }, [refreshProfileAnalytics]);

  useEffect(() => { refresh(); }, [refresh]);

  const checklist = useMemo(() => [
    { label: 'Add an avatar', done: Boolean(profile.media?.avatar?.src), icon: Image, to: '/dashboard/editor' },
    { label: 'Add your first link', done: profile.links.length > 0, icon: Link2, to: '/dashboard/editor' },
    { label: 'Pick a background', done: Boolean(profile.media?.background?.src) || profile.effects?.background !== 'none', icon: Palette, to: '/dashboard/editor' },
  ], [profile]);
  const completed = checklist.filter((item) => item.done).length;

  const copy = async () => {
    try { await navigator.clipboard.writeText(profileUrl); toast.success('Profile link copied'); }
    catch { toast.error('Copy failed. Select the link and copy it manually.'); }
  };

  return <div className="mx-auto w-full max-w-7xl pb-10" data-testid="overview-page">
    <section className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs font-semibold uppercase tracking-[.14em] text-primary">Overview</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {profile.alias || user.username}.</h1><p className="mt-2 text-sm text-muted-foreground">A clear view of your profile and the next useful move.</p></div><Link to="/dashboard/editor" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">Edit profile <ArrowRight className="h-4 w-4" /></Link></section>

    <section className="glass mt-7 flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center" aria-label="Your public profile link"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><ExternalLink className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-muted-foreground">Your public profile</p><p className="mt-1 truncate font-mono text-sm text-foreground">user.pet/{user.username}</p></div><div className="flex gap-2"><button type="button" onClick={copy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-primary/[.08]"><Copy className="h-4 w-4" />Copy</button><Link to={`/${user.username}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-primary/[.08]">View <ExternalLink className="h-4 w-4" /></Link></div></section>

    {error && <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200"><span>{error}</span><button type="button" onClick={refresh} className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 font-semibold"><RefreshCw className="h-4 w-4" />Retry</button></div>}

    <section className="mt-4 grid gap-4 sm:grid-cols-3" aria-label="Profile statistics">
      <StatCard loading={loading} icon={Eye} label="Profile views" value={number.format(profile.views || 0)} detail={profile.views ? 'All recorded profile views' : 'Share your profile to start collecting views'} />
      <StatCard loading={loading} icon={MousePointerClick} label="Link clicks" value={number.format(profile.clicks || 0)} detail={profile.clicks ? 'Clicks across your profile links' : 'No link clicks recorded yet'} />
      <StatCard loading={loading} icon={Link2} label="Live links" value={number.format(profile.links.length)} detail={profile.links.length ? 'Links currently on your profile' : 'Add a link in the Editor'} />
    </section>

    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
      <section className="glass rounded-3xl p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Finish setting up</p><h2 className="mt-2 font-display text-xl font-bold">Make the profile unmistakably yours.</h2></div><span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-bold text-primary">{completed}/{checklist.length}</span></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${completed / checklist.length * 100}%` }} /></div><ul className="mt-4 grid gap-2">{checklist.map(({ label, done, icon: Icon, to }) => <li key={label}><Link to={to} className="flex items-center gap-3 rounded-xl border border-border bg-background/30 p-3 hover:bg-primary/[.06]"><span className={`grid h-8 w-8 place-items-center rounded-lg ${done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-primary/10 text-primary'}`}>{done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span><span className={`text-sm font-semibold ${done ? 'text-muted-foreground line-through' : ''}`}>{label}</span><Circle className="ml-auto h-3 w-3 text-muted-foreground" /></Link></li>)}</ul></section>

      <section className="glass rounded-3xl p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Quick actions</p><h2 className="mt-2 font-display text-xl font-bold">Keep building momentum.</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><Link to="/dashboard/editor" className="group rounded-2xl border border-border bg-background/30 p-4 hover:border-primary/40 hover:bg-primary/[.06]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary"><Sparkles className="h-4 w-4" /></span><strong className="mt-6 block text-sm">Open the Editor</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Refine identity, links and effects.</span><ArrowRight className="mt-4 h-4 w-4 text-primary transition-transform group-hover:translate-x-1" /></Link><Link to={user.role === 'founder' ? '/dashboard/visitors' : '/dashboard/settings'} className="group rounded-2xl border border-border bg-background/30 p-4 hover:border-primary/40 hover:bg-primary/[.06]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary">{user.role === 'founder' ? <Eye className="h-4 w-4" /> : <Palette className="h-4 w-4" />}</span><strong className="mt-6 block text-sm">{user.role === 'founder' ? 'Review analytics' : 'Account settings'}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{user.role === 'founder' ? 'See aggregate traffic and activity.' : 'Manage access and account details.'}</span><ArrowRight className="mt-4 h-4 w-4 text-primary transition-transform group-hover:translate-x-1" /></Link></div></section>
    </div>
  </div>;
}
