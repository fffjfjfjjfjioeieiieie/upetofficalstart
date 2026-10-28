import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { subscribePublicRedesign } from '../lib/firebaseStore.js';
import { defaultProfile } from '../lib/profileModel.js';
import { ProfileScene } from '../components/ProfileCard.jsx';
import DonationExperience from '../components/donations/DonationExperience.jsx';

export default function DonatePage() {
  const { username = '' } = useParams();
  const slug = username.toLowerCase();
  const [search] = useSearchParams();
  const [page, setPage] = useState(null);
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState('loading');
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

  const checkout = async (form) => {
    if (!Number.isInteger(form.amount) || form.amount < 300 || form.amount > 500000) return toast.error('Choose an amount between £3 and £5,000.');
    setSubmitting(true);
    try {
      const response = await fetch('/api/donations/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageSlug: slug, ...form }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign(result.url);
    } catch (error) { toast.error(error.message); setSubmitting(false); }
  };

  if (state === 'loading') return <main className="grid min-h-[100dvh] place-items-center bg-[#09090f] px-6 text-white"><div className="text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /><p className="mt-4 text-sm text-white/55">Preparing this donation page…</p></div></main>;
  if (state === 'not-found') return <main className="grid min-h-[100dvh] place-items-center bg-[#09090f] px-6 text-center text-white"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-white/45">Nothing here yet</p><h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">Donation page unavailable</h1><p className="mx-auto mt-4 max-w-md text-white/55">This page may not be published, or its creator may still be connecting payments.</p><Link className="mt-7 inline-flex rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground" to={`/${slug}`}>Back to profile</Link></div></main>;

  const themed = profile || defaultProfile(slug);
  return <ProfileScene p={themed} scrollable className="min-h-[100dvh] w-full">
    {search.get('thanks') === '1' && <div role="status" className="fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-full border border-emerald-300/30 bg-emerald-950/90 px-5 py-3 text-center text-sm font-semibold text-emerald-100 shadow-2xl backdrop-blur-xl">Thank you—your donation was completed.</div>}
    <DonationExperience page={page} profile={themed} slug={slug} supporters={page.recentSupporters} submitting={submitting} onDonate={checkout} />
  </ProfileScene>;
}
