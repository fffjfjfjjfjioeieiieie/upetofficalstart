import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '../../../app/firebase.js';
import { PageTitle, Panel, Field, inputCls, btnCls } from '../../components/Controls.jsx';

const money = (pence) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format((Number(pence) || 0) / 100);

async function donationRequest(path, options = {}) {
  const token = await auth?.currentUser?.getIdToken();
  const response = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Donation request failed.');
  return result;
}

export default function Donations() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ title: '', story: '', goal: '', published: false });
  const [busy, setBusy] = useState('load');
  const load = useCallback(async () => {
    setBusy('load');
    try {
      const result = await donationRequest('/api/donations/manage');
      setData(result);
      setForm({ title: result.page.title, story: result.page.story, goal: result.page.goalAmount == null ? '' : String(result.page.goalAmount / 100), published: result.page.published });
    } catch (error) { toast.error(error.message); }
    finally { setBusy(''); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const connect = async () => {
    setBusy('connect');
    try {
      const result = await donationRequest('/api/donations/connect', { method: 'POST' });
      window.location.assign(result.url);
    } catch (error) { toast.error(error.message); setBusy(''); }
  };
  useEffect(() => {
    const stripeReturn = new URLSearchParams(window.location.search).get('stripe');
    if (!stripeReturn) return;
    window.history.replaceState({}, '', '/dashboard/donations');
    if (stripeReturn === 'refresh') connect();
    else if (stripeReturn === 'return') toast.success('Stripe details received. Checking account status…');
  }, []);
  const save = async (event) => {
    event.preventDefault();
    const goalAmount = form.goal === '' ? null : Math.round(Number(form.goal) * 100);
    if (form.goal !== '' && (!Number.isFinite(goalAmount) || goalAmount < 100)) return toast.error('Enter a valid goal of at least £1.');
    setBusy('save');
    try {
      const result = await donationRequest('/api/donations/manage', { method: 'POST', body: JSON.stringify({ title: form.title, story: form.story, goalAmount, published: form.published }) });
      setData(result);
      toast.success('Donation page saved');
    } catch (error) { toast.error(error.message); }
    finally { setBusy(''); }
  };
  const ready = data?.stripeStatus === 'ready';

  return <div data-testid="donations-page">
    <PageTitle title="Donations" sub="Connect Stripe, publish a simple supporter page, and track contributions." />
    <div className="space-y-4">
      <Panel title="1. Connect Stripe" desc="Payout details stay with Stripe. user.pet only creates test-mode donation checkouts." defaultOpen>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/40 p-4">
          <div><p className="text-sm font-semibold capitalize">Status: {data?.stripeStatus || 'loading'}</p><p className="mt-1 text-xs text-muted-foreground">{ready ? 'Your account can receive donations.' : 'Complete Stripe onboarding before publishing.'}</p></div>
          <button type="button" className={btnCls} disabled={Boolean(busy)} onClick={connect}>{busy === 'connect' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}{ready ? 'Review Stripe account' : 'Connect Stripe'}</button>
        </div>
      </Panel>
      <Panel title="2. Page settings" desc="Keep this first version focused; layout customization comes later." defaultOpen>
        <form onSubmit={save} className="space-y-4">
          <Field label="Title"><input className={inputCls} maxLength={100} required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="Support my work" /></Field>
          <Field label={`Story (${form.story.length}/2000)`}><textarea className={`${inputCls} min-h-36 resize-y`} maxLength={2000} value={form.story} onChange={(event) => setForm((value) => ({ ...value, story: event.target.value }))} placeholder="Tell supporters what their donation makes possible." /></Field>
          <Field label="Goal in pounds (optional)"><input className={inputCls} type="number" min="1" step="0.01" inputMode="decimal" value={form.goal} onChange={(event) => setForm((value) => ({ ...value, goal: event.target.value }))} placeholder="500" /></Field>
          <label className="flex items-center justify-between gap-4 rounded-xl border bg-background/40 p-3 text-sm"><span><span className="block font-semibold">Published</span><span className="text-xs text-muted-foreground">Makes /{data?.page.slug || 'username'}/donate public.</span></span><input type="checkbox" className="h-5 w-5 accent-primary" disabled={!ready} checked={form.published} onChange={(event) => setForm((value) => ({ ...value, published: event.target.checked }))} /></label>
          <button className={btnCls} disabled={Boolean(busy)}>{busy === 'save' && <Loader2 className="h-4 w-4 animate-spin" />}Save page</button>
        </form>
      </Panel>
      <Panel title="Donations" desc="Your latest 10 paid donations.">
        <div className="mb-4 rounded-xl border bg-primary/10 p-4"><p className="text-xs text-muted-foreground">Total raised</p><p className="mt-1 font-display text-3xl font-black">{money(data?.totalRaised)}</p><p className="mt-2 text-xs text-muted-foreground">Estimated fees: {money(data?.estimatedFees)}{data?.charityApproved ? ' · 0% platform margin for approved charity' : ''}</p></div>
        <div className="space-y-2">{data?.donations?.map((donation) => <div key={donation.id} className="rounded-xl border bg-background/40 p-3"><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{donation.anonymous ? 'Anonymous' : donation.donorName || 'Supporter'}</span><span>{money(donation.amount)}</span></div>{donation.message && <p className="mt-1 text-xs text-muted-foreground">{donation.message}</p>}</div>)}{!busy && !data?.donations?.length && <p className="text-sm text-muted-foreground">No donations yet.</p>}</div>
      </Panel>
    </div>
  </div>;
}
