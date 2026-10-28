import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, HandHeart, Loader2, RefreshCw, Target, Users } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '../../../app/firebase.js';
import { PageTitle, Panel, Field, inputCls, btnCls, ghostCls } from '../../components/Controls.jsx';
import { Switch } from '../../components/ui/switch.jsx';
import { ProfileScene } from '../../components/ProfileCard.jsx';
import DonationExperience, { money } from '../../components/donations/DonationExperience.jsx';
import { useStore } from '../../lib/store.js';

const EMPTY_FORM = { title: '', story: '', goal: '', published: false };

async function donationRequest(path, options = {}) {
  const token = await auth?.currentUser?.getIdToken();
  const response = await fetch(path, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Donation request failed.');
  return result;
}

const formFromPage = (page) => ({ title: page.title || '', story: page.story || '', goal: page.goalAmount == null ? '' : String(page.goalAmount / 100), published: page.published === true });
const sameForm = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const statusMeta = {
  none: { label: 'Not connected', cls: 'bg-white/10 text-muted-foreground' },
  pending: { label: 'Onboarding incomplete', cls: 'bg-amber-500/15 text-amber-300' },
  ready: { label: 'Ready', cls: 'bg-emerald-500/15 text-emerald-300' },
};

function LoadingSkeleton() {
  return <div aria-label="Loading donation settings" className="space-y-4"><div className="glass h-28 animate-pulse rounded-2xl" /><div className="grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="glass h-24 animate-pulse rounded-2xl" />)}</div><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]"><div className="glass h-96 animate-pulse rounded-2xl" /><div className="glass h-[34rem] animate-pulse rounded-2xl" /></div></div>;
}

export default function Donations() {
  const { user } = useStore();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState(EMPTY_FORM);
  const [state, setState] = useState('loading');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const loadController = useRef(null);

  const load = useCallback(async () => {
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;
    setState('loading'); setError('');
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const result = await donationRequest('/api/donations/manage', { signal: controller.signal });
      const nextForm = formFromPage(result.page);
      setData(result); setForm(nextForm); setSavedForm(nextForm); setState('ready');
    } catch (loadError) {
      if (controller.signal.aborted) setError('Donation settings took too long to load. Check your connection and try again.');
      else setError(loadError.message || 'Donation settings could not be loaded.');
      setState('error');
    } finally { clearTimeout(timeout); }
  }, []);

  useEffect(() => { load(); return () => loadController.current?.abort(); }, [load]);
  useEffect(() => {
    const stripeReturn = new URLSearchParams(window.location.search).get('stripe');
    if (!stripeReturn) return;
    window.history.replaceState({}, '', '/dashboard/donations');
    if (stripeReturn === 'return') toast.success('Stripe details received. Checking account status…');
    if (stripeReturn === 'refresh') {
      setBusy('connect');
      donationRequest('/api/donations/connect', { method: 'POST' }).then((result) => window.location.assign(result.url)).catch((refreshError) => { toast.error(refreshError.message); setBusy(''); });
    }
  }, []);

  const connect = async () => {
    setBusy('connect');
    try { const result = await donationRequest('/api/donations/connect', { method: 'POST' }); window.location.assign(result.url); }
    catch (connectError) { toast.error(connectError.message); setBusy(''); }
  };
  const save = async (event) => {
    event.preventDefault();
    const goalAmount = form.goal === '' ? null : Math.round(Number(form.goal) * 100);
    if (form.goal !== '' && (!Number.isFinite(goalAmount) || goalAmount < 100)) return toast.error('Enter a valid goal of at least £1.');
    setBusy('save');
    try {
      const result = await donationRequest('/api/donations/manage', { method: 'POST', body: JSON.stringify({ title: form.title, story: form.story, goalAmount, published: form.published }) });
      const nextForm = formFromPage(result.page);
      setData(result); setForm(nextForm); setSavedForm(nextForm); toast.success('Donation page saved');
    } catch (saveError) { toast.error(saveError.message); }
    finally { setBusy(''); }
  };

  const ready = data?.stripeStatus === 'ready';
  const status = statusMeta[data?.stripeStatus] || statusMeta.none;
  const dirty = !sameForm(form, savedForm);
  const goalAmount = form.goal === '' ? null : Math.max(0, Math.round(Number(form.goal || 0) * 100));
  const progress = goalAmount && data ? Math.min(100, (data.totalRaised || 0) / goalAmount * 100) : 0;
  const pageUrl = data ? `${window.location.origin}/${encodeURIComponent(data.page.slug)}/donate` : '';
  const previewPage = useMemo(() => data ? ({ ...data.page, title: form.title, story: form.story, goalAmount, totalRaised: data.totalRaised, charityApproved: data.charityApproved }) : null, [data, form, goalAmount]);

  if (state === 'loading' && !data) return <div data-testid="donations-page"><PageTitle title="Donations" sub="Connect Stripe, shape your supporter page, and track contributions." /><LoadingSkeleton /></div>;
  if (state === 'error' && !data) return <div data-testid="donations-page"><PageTitle title="Donations" sub="Connect Stripe, shape your supporter page, and track contributions." /><Panel><div className="py-8 text-center"><p className="font-display text-lg font-black">Couldn’t load donations</p><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{error}</p><button type="button" onClick={load} className={`${btnCls} mt-5`}><RefreshCw className="h-4 w-4" />Retry</button></div></Panel></div>;

  const copyLink = async () => { try { await navigator.clipboard.writeText(pageUrl); toast.success('Donation page link copied'); } catch { toast.error('Could not copy the link.'); } };

  return <div data-testid="donations-page">
    <PageTitle title="Donations" sub="Connect Stripe, shape your supporter page, and track contributions." />
    <div className="space-y-4 md:space-y-6">
      <section className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 md:p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary"><HandHeart className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-sm font-semibold">Stripe connection</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.cls}`}>{status.label}</span></div><p className="mt-1 text-xs text-muted-foreground">{ready ? 'Payments and payouts are ready.' : data?.stripeStatus === 'pending' ? 'Finish Stripe onboarding before publishing.' : 'Connect an account to accept donations.'}</p></div></div><button type="button" className={btnCls} disabled={Boolean(busy)} onClick={connect}>{busy === 'connect' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}{ready ? 'Manage Stripe' : data?.stripeStatus === 'pending' ? 'Continue onboarding' : 'Connect Stripe'}</button></section>

      <div className="grid gap-3 sm:grid-cols-3">{[
        ['Total raised', money(data.totalRaised), HandHeart],
        ['Donations', String(data.donationCount || 0), Users],
        ['Goal progress', goalAmount ? `${Math.round(progress)}%` : 'No goal', Target],
      ].map(([label, value, Icon]) => <section key={label} className="glass rounded-2xl p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-primary" /></div><p className="mt-3 font-display text-2xl font-black">{value}</p></section>)}</div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-6">
        <div className="min-w-0 space-y-4">
          <Panel title="Page settings" desc="Edits appear in the preview immediately." defaultOpen>
            <form onSubmit={save} className="space-y-4">
              <Field label="Title"><input className={inputCls} maxLength={100} required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="Support my work" /></Field>
              <Field label={`Story · ${form.story.length}/2000`}><textarea className={`${inputCls} min-h-40 resize-y leading-6`} maxLength={2000} value={form.story} onChange={(event) => setForm((value) => ({ ...value, story: event.target.value }))} placeholder="Tell supporters what their donation makes possible." /></Field>
              <Field label="Goal in pounds · optional"><input className={inputCls} type="number" min="1" step="0.01" inputMode="decimal" value={form.goal} onChange={(event) => setForm((value) => ({ ...value, goal: event.target.value }))} placeholder="500" /></Field>
              <label className="flex items-center justify-between gap-4 rounded-xl border bg-background/40 p-3"><span><span className="block text-sm font-semibold">Published</span><span className="mt-1 block text-xs text-muted-foreground">Makes /{data.page.slug}/donate available to everyone.</span></span><Switch disabled={!ready} checked={form.published} onCheckedChange={(published) => setForm((value) => ({ ...value, published }))} /></label>
              <div className="flex flex-wrap items-center gap-2"><button className={btnCls} disabled={Boolean(busy) || !dirty}>{busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : dirty ? null : <Check className="h-4 w-4" />}{busy === 'save' ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</button>{data.page.published && <><button type="button" onClick={copyLink} className={ghostCls}><Copy className="h-4 w-4" />Copy page link</button><a href={pageUrl} target="_blank" rel="noreferrer" className={ghostCls}>View page<ExternalLink className="h-4 w-4" /></a></>}</div>
              {dirty && <p role="status" className="text-xs font-medium text-amber-300">You have unsaved changes.</p>}
            </form>
          </Panel>

          <Panel title="Recent donations" desc="Your latest 10 completed contributions." defaultOpen>
            {data.donations.length ? <div className="divide-y divide-border/70">{data.donations.map((donation) => <article key={donation.id} className="py-4 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold">{donation.anonymous ? 'Anonymous' : donation.donorName || 'Supporter'}</p>{donation.createdAt && <time className="mt-1 block text-xs text-muted-foreground" dateTime={new Date(donation.createdAt).toISOString()}>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(donation.createdAt)}</time>}</div><span className="font-display text-lg font-black">{money(donation.amount)}</span></div>{donation.message && <p className="mt-3 rounded-xl bg-background/40 p-3 text-sm leading-6 text-muted-foreground">{donation.message}</p>}</article>)}</div> : <div className="rounded-xl border border-dashed p-8 text-center"><Users className="mx-auto h-6 w-6 text-primary" /><p className="mt-3 text-sm font-semibold">No donations yet</p><p className="mt-1 text-xs text-muted-foreground">Completed contributions will appear here.</p></div>}
            <p className="mt-4 border-t pt-4 text-xs leading-5 text-muted-foreground">Estimated processing and platform fees: {money(data.estimatedFees)}. The creator receives about {money(Math.max(0, data.totalRaised - data.estimatedFees))}{data.charityApproved ? '; the platform margin is waived for this approved charity.' : '.'}</p>
          </Panel>
        </div>

        <aside className="rounded-2xl border border-primary/15 bg-background/40 p-3 xl:sticky xl:top-6"><div className="mb-3 flex items-center justify-between gap-3 px-1"><div><p className="text-xs font-bold uppercase tracking-[.2em]">Live preview</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">/{data.page.slug}/donate</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">Updates as you type</span></div><div className="h-[min(720px,calc(100dvh-9rem))] min-h-[540px] overflow-y-auto rounded-[1.35rem] border border-white/15 bg-black shadow-2xl"><ProfileScene p={user.profile} scrollable className="min-h-full w-full"><DonationExperience page={previewPage} profile={user.profile} slug={data.page.slug} compact preview /></ProfileScene></div></aside>
      </div>
    </div>
  </div>;
}
