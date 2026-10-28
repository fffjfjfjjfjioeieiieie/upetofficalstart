import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Heart, LockKeyhole } from 'lucide-react';
import { calculateDonationCharge } from '../../../shared/donationFees.js';

export const money = (pence) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format((Number(pence) || 0) / 100);

const amountField = 'w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/50 focus:ring-2 focus:ring-white/20';

function Reveal({ children, delay = 0, className = '' }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 24 }} whileInView={reduced ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.55, delay, ease: [0.2, 0.8, 0.2, 1] }}>{children}</motion.div>;
}

function HeroBlock({ page, slug, compact }) {
  const progress = page.goalAmount ? Math.min(100, (Number(page.totalRaised) || 0) / page.goalAmount * 100) : 0;
  return <Reveal className={compact ? 'space-y-5' : 'space-y-7'}>
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.2em]"><Heart className="h-3.5 w-3.5" />Support @{slug}</div>
    <h1 className={`max-w-4xl font-display font-black leading-[.96] tracking-[-.04em] ${compact ? 'text-4xl' : 'text-5xl sm:text-7xl lg:text-[6.5rem]'}`}>{page.title || 'Support my work'}</h1>
    <p className={`max-w-3xl whitespace-pre-line text-white/75 ${compact ? 'text-sm leading-6' : 'text-lg leading-8 sm:text-xl sm:leading-9'}`}>{page.story || 'Tell supporters what their contribution makes possible.'}</p>
    {page.goalAmount ? <div className="max-w-3xl" aria-label={`${Math.round(progress)}% of donation goal reached`}>
      <div className="mb-3 flex items-end justify-between gap-4"><div><span className={`font-display font-black ${compact ? 'text-xl' : 'text-3xl'}`}>{money(page.totalRaised)}</span><span className="ml-2 text-sm text-white/55">raised</span></div><span className="text-sm font-semibold text-white/70">{Math.round(progress)}% of {money(page.goalAmount)}</span></div>
      <div className={`${compact ? 'h-2.5' : 'h-4'} overflow-hidden rounded-full border border-white/10 bg-black/35`}><motion.div initial={{ width: 0 }} whileInView={{ width: `${progress}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: page.accent }} /></div>
    </div> : <p className="text-sm font-semibold text-white/55">Every contribution makes a difference.</p>}
  </Reveal>;
}

function GivingBlock({ page, compact, submitting, preview, onDonate }) {
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState('');
  const [form, setForm] = useState({ donorName: '', message: '', anonymous: false, coverFees: false });
  const pledgedAmount = custom === '' ? amount : Math.round(Number(custom || 0) * 100);
  const estimate = calculateDonationCharge(Math.max(0, Number.isInteger(pledgedAmount) ? pledgedAmount : 0), { charityApproved: page.charityApproved, coverFees: form.coverFees });
  const submit = (event) => { event.preventDefault(); if (!preview) onDonate?.({ amount: pledgedAmount, ...form }); };
  return <Reveal delay={0.08} className={`rounded-[2rem] border border-white/15 bg-[#0e0e17]/85 shadow-2xl shadow-black/30 backdrop-blur-2xl ${compact ? 'p-4' : 'p-5 sm:p-7'}`}>
    <div className="mb-5"><p className="font-display text-lg font-black">Choose your contribution</p><p className="mt-1 text-sm text-white/55">Secure checkout powered by Stripe.</p></div>
    <form onSubmit={submit} className="space-y-5">
      <fieldset><legend className="mb-2 text-sm font-semibold text-white/75">Donation amount</legend><div className="grid grid-cols-4 gap-2">{[500, 1000, 2500, 5000].map((value) => <button type="button" key={value} aria-pressed={custom === '' && amount === value} onClick={() => { setAmount(value); setCustom(''); }} className={`rounded-xl border px-2 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-white/30 ${custom === '' && amount === value ? 'border-white/60 bg-white text-black' : 'border-white/15 bg-white/[.05] text-white hover:bg-white/10'}`}>{money(value)}</button>)}</div></fieldset>
      <label className="block text-sm font-semibold text-white/75">Custom amount (£)<input className={`${amountField} mt-2`} type="number" min="3" max="5000" step="0.01" inputMode="decimal" value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="3.00" /></label>
      {!compact && <><label className="block text-sm font-semibold text-white/75">Name <span className="font-normal text-white/45">(optional)</span><input className={`${amountField} mt-2`} maxLength={80} disabled={form.anonymous} value={form.donorName} onChange={(event) => setForm((value) => ({ ...value, donorName: event.target.value }))} /></label>
      <label className="block text-sm font-semibold text-white/75">Message <span className="font-normal text-white/45">(optional · {form.message.length}/200)</span><textarea className={`${amountField} mt-2 min-h-28 resize-y`} maxLength={200} value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} /></label>
      <label className="flex items-center gap-3 text-sm text-white/75"><input type="checkbox" className="h-4 w-4 rounded accent-white" checked={form.anonymous} onChange={(event) => setForm((value) => ({ ...value, anonymous: event.target.checked }))} />Donate anonymously</label>
      <label className="flex items-start gap-3 text-sm text-white/75"><input type="checkbox" className="mt-0.5 h-4 w-4 rounded accent-white" checked={form.coverFees} onChange={(event) => setForm((value) => ({ ...value, coverFees: event.target.checked }))} /><span>Cover processing and platform fees{form.coverFees ? ` · total ${money(estimate.chargeAmount)}` : ''}</span></label></>}
      <p className="text-xs leading-5 text-white/50">Estimated fees: {money(estimate.fee)}. {form.coverFees ? `The creator receives the full ${money(pledgedAmount)} pledge.` : `The creator receives about ${money(Math.max(0, pledgedAmount - estimate.fee))}.`}</p>
      <button type="submit" disabled={submitting || preview} className={`${compact ? '' : 'sticky bottom-3 sm:static'} flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-black text-black shadow-xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:cursor-default disabled:opacity-80`} style={{ background: page.accent }}>{submitting ? 'Opening secure checkout…' : preview ? 'Preview · checkout disabled' : <>Donate {money(estimate.chargeAmount)}<ArrowRight className="h-5 w-5" /></>}</button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-white/45"><LockKeyhole className="h-3.5 w-3.5" />Payment details are handled securely by Stripe.</p>
    </form>
  </Reveal>;
}

function SupportersBlock({ supporters, compact }) {
  if (compact) return null;
  return <Reveal className="border-t border-white/10 py-12 sm:py-16"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-white/45">Community</p><h2 className="mt-2 font-display text-3xl font-black sm:text-4xl">Recent supporters</h2></div><span className="text-sm text-white/45">{supporters.length ? `${supporters.length} recent` : 'Be the first'}</span></div>{supporters.length ? <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">{supporters.map((supporter, index) => <article key={`${supporter.name}-${index}`} className="bg-[#0e0e17] p-5"><div className="flex items-center justify-between gap-4"><strong>{supporter.name || 'Supporter'}</strong><span className="font-display font-black">{money(supporter.amount)}</span></div>{supporter.message && <p className="mt-3 text-sm leading-6 text-white/60">{supporter.message}</p>}</article>)}</div> : <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/55">No supporters yet. Your contribution could start something brilliant.</div>}</Reveal>;
}

export default function DonationExperience({ page, profile, slug, supporters = [], compact = false, preview = false, submitting = false, onDonate }) {
  const accent = profile?.card?.accent || '#968ad0';
  const view = useMemo(() => ({ ...page, accent }), [page, accent]);
  const blocks = [
    { id: 'hero', node: <HeroBlock page={view} slug={slug} compact={compact} /> },
    { id: 'giving', node: <GivingBlock page={view} compact={compact} submitting={submitting} preview={preview} onDonate={onDonate} /> },
    { id: 'supporters', node: <SupportersBlock supporters={supporters} compact={compact} /> },
  ];
  return <div className={`mx-auto w-full text-white ${compact ? 'max-w-md p-4' : 'max-w-7xl px-4 pb-10 pt-12 sm:px-8 sm:pb-16 sm:pt-20 lg:px-12'}`}>
    <div className={compact ? 'space-y-6' : 'grid min-h-[72dvh] items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)] lg:gap-16'}>{blocks.slice(0, 2).map((block) => <div key={block.id}>{block.node}</div>)}</div>
    {blocks[2].node}
    {!compact && <p className="mx-auto max-w-2xl border-t border-white/10 pt-7 text-center text-xs leading-5 text-white/45">Donations go to this creator, not user.pet. Contact the creator about refunds or questions about how contributions are used.</p>}
  </div>;
}
