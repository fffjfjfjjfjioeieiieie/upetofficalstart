import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { subscribePublicRedesign } from '../lib/firebaseStore.js';
import { defaultProfile } from '../lib/profileModel.js';
import { ProfileScene } from '../components/ProfileCard.jsx';

const money = (pence) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format((Number(pence) || 0) / 100);
const field = 'w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40';

export default function DonatePage() {
  const { username = '' } = useParams();
  const slug = username.toLowerCase();
  const [search] = useSearchParams();
  const [page, setPage] = useState(null);
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState('loading');
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState('');
  const [form, setForm] = useState({ donorName: '', message: '', anonymous: false });
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(`/api/donations/page?slug=${encodeURIComponent(slug)}`).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (active) { setPage(result); setState('ready'); }
    }).catch(() => active && setState('not-found'));
    const unsubscribe = subscribePublicRedesign(slug, (value) => setProfile(value), () => {});
    return () => { active = false; unsubscribe(); };
  }, [slug]);
  const checkout = async (event) => {
    event.preventDefault();
    const chosen = custom === '' ? amount : Math.round(Number(custom) * 100);
    if (!Number.isInteger(chosen) || chosen < 300 || chosen > 500000) return toast.error('Choose an amount between £3 and £5,000.');
    setSubmitting(true);
    try {
      const response = await fetch('/api/donations/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageSlug: slug, amount: chosen, ...form }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign(result.url);
    } catch (error) { toast.error(error.message); setSubmitting(false); }
  };
  if (state === 'loading') return <div className="grid min-h-screen place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (state === 'not-found') return <div className="grid min-h-screen place-items-center px-6 text-center"><div><h1 className="font-display text-4xl font-black">Donation page not found</h1><Link className="mt-4 inline-block text-primary" to={`/${slug}`}>Back to profile</Link></div></div>;
  const themed = profile || defaultProfile(slug);
  const progress = page.goalAmount ? Math.min(100, page.totalRaised / page.goalAmount * 100) : 0;
  return <ProfileScene p={themed} scrollable className="min-h-[100dvh] w-full py-10">
    <main className="mx-auto w-full max-w-2xl px-4 text-white">
      <section className="rounded-[28px] border border-white/15 bg-black/50 p-5 shadow-2xl backdrop-blur-xl sm:p-8" style={{ color: themed.card.textColor }}>
        {search.get('thanks') === '1' && <div className="mb-5 rounded-xl border border-emerald-300/30 bg-emerald-400/15 p-3 text-sm">Thank you. Your donation was completed.</div>}
        <p className="text-xs font-semibold uppercase tracking-[.18em] opacity-60">Support @{slug}</p><h1 className="mt-2 font-display text-3xl font-black sm:text-5xl">{page.title}</h1>{page.story && <p className="mt-4 whitespace-pre-line text-sm leading-7 opacity-80">{page.story}</p>}
        {page.goalAmount && <div className="mt-6"><div className="mb-2 flex justify-between text-xs"><span>{money(page.totalRaised)} raised</span><span>{money(page.goalAmount)} goal</span></div><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full" style={{ width: `${progress}%`, background: themed.card.accent }} /></div></div>}
        <form onSubmit={checkout} className="mt-7 space-y-4"><div><p className="mb-2 text-xs font-semibold opacity-70">Donation amount</p><div className="grid grid-cols-3 gap-2">{[500, 1000, 2500].map((value) => <button type="button" key={value} onClick={() => { setAmount(value); setCustom(''); }} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${custom === '' && amount === value ? 'border-white/60 bg-white/20' : 'border-white/15 bg-white/5'}`}>{money(value)}</button>)}</div></div>
          <label className="block text-xs opacity-70">Custom amount (£)<input className={`${field} mt-1.5`} type="number" min="3" max="5000" step="0.01" value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="3.00" /></label>
          <label className="block text-xs opacity-70">Name (optional)<input className={`${field} mt-1.5`} maxLength={80} disabled={form.anonymous} value={form.donorName} onChange={(event) => setForm((value) => ({ ...value, donorName: event.target.value }))} /></label>
          <label className="block text-xs opacity-70">Message (optional, {form.message.length}/200)<textarea className={`${field} mt-1.5 min-h-24 resize-y`} maxLength={200} value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={form.anonymous} onChange={(event) => setForm((value) => ({ ...value, anonymous: event.target.checked }))} />Donate anonymously</label>
          <button disabled={submitting} className="w-full rounded-full px-5 py-3 text-sm font-bold text-black disabled:opacity-50" style={{ background: themed.card.accent }}>{submitting ? 'Opening secure checkout…' : `Donate ${money(custom === '' ? amount : Math.round(Number(custom || 0) * 100))}`}</button>
        </form>
      </section>
      {page.recentSupporters.length > 0 && <section className="mt-4 rounded-[24px] border border-white/15 bg-black/40 p-5 backdrop-blur-xl"><h2 className="font-display text-lg font-bold">Recent supporters</h2><div className="mt-3 space-y-3">{page.recentSupporters.map((supporter, index) => <div key={`${supporter.name}-${index}`} className="border-t border-white/10 pt-3 first:border-0 first:pt-0"><div className="flex justify-between text-sm font-semibold"><span>{supporter.name}</span><span>{money(supporter.amount)}</span></div>{supporter.message && <p className="mt-1 text-xs opacity-60">{supporter.message}</p>}</div>)}</div></section>}
      <p className="mx-auto mt-4 max-w-lg text-center text-xs text-white/60">Donations go directly to this creator, not user.pet. Contact us for refunds.</p>
    </main>
  </ProfileScene>;
}
