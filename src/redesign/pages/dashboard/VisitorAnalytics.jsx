import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { auth } from '../../../app/firebase';
import { Panel, PageTitle } from '../../components/Controls';

async function api(method, body) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in again to view visitor analytics.');
  const response = await fetch('/api/visitor', { method, credentials: 'same-origin', headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Visitor request failed.');
  return result;
}

const Chart = ({ title, data }) => <Panel title={title}><div className="h-56">{data?.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 16, right: 15 }}><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#8a74ee" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer> : <p className="text-sm text-muted-foreground">No data yet.</p>}</div></Panel>;

export default function VisitorAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(null);
  const refresh = () => api('GET').then(setData).catch((e) => setError(e.message));
  useEffect(() => { refresh(); const timer = setInterval(refresh, 30000); return () => clearInterval(timer); }, []);
  const enroll = async () => {
    setError('');
    try {
      const result = await api('PUT', { route: location.pathname, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, language: navigator.language, screen: `${screen.width}x${screen.height}`, viewport: `${innerWidth}x${innerHeight}` });
      setEnrolled(result);
      sessionStorage.setItem('upet-diagnostic-test', 'yes');
    } catch (e) { setError(e.message); }
  };
  const revoke = async () => { try { await api('DELETE', {}); sessionStorage.removeItem('upet-diagnostic-test'); setEnrolled(null); } catch (e) { setError(e.message); } };
  const s = data?.summary;
  return <div><PageTitle title="Visitor analytics" sub="Site-wide aggregate traffic and a separate browser diagnostic test" />
    {s?.partial && <p className="mb-4 text-sm text-amber-400">The reporting window is incomplete; totals are partial.</p>}
    {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
    <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Estimated active IPs', s?.live], ['Estimated visits today', s?.today.visits], ['Page views today', s?.today.pageViews], ['Conversions today', s?.today.conversions], ['Estimated visits this week', s?.week.visits], ['Page views this week', s?.week.pageViews], ['Estimated unique IPs today', s?.today.unique], ['Bot page views', s?.security.bots]].map(([label, value]) => <Panel key={label} title={label}><strong className="text-3xl">{value ?? '—'}</strong></Panel>)}</div>
    <div className="grid gap-4 lg:grid-cols-2">{[['Daily visits (UK time)', s?.daily], ['Top pages', s?.pages], ['Countries', s?.countries], ['Devices', s?.devices], ['Browsers', s?.browsers], ['Traffic sources', s?.sources], ['Popular profiles', s?.profiles]].map(([title, list]) => <Chart key={title} title={title} data={list} />)}</div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><Panel title="Conversion funnel"><p className="text-sm">Visits: {s?.funnel.visits ?? '—'} · Sign ups: {s?.funnel.signups ?? '—'}</p></Panel><Panel title="VPN and proxy estimates"><p className="text-sm">Inspected: {s?.network.inspected ?? '—'} · VPN: {s?.network.vpn ?? '—'} · Proxy: {s?.network.proxy ?? '—'}</p><p className="mt-2 text-xs text-muted-foreground">Only voluntarily enrolled diagnostic sessions are inspected.</p></Panel></div>
    <Panel className="mt-4" title="My diagnostic test" desc="Start a 24-hour test for this browser, then verify it from your authorised Discord account."><div className="flex flex-wrap items-center gap-3"><button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={enroll}>Start diagnostic test</button><button className="rounded-lg border px-4 py-2 text-sm" onClick={revoke}>Delete my diagnostic data</button></div>{enrolled && <p className="mt-3 text-sm">In Discord, run <code>/visitor claim {enrolled.claimCode}</code> within 10 minutes. Then use <code>/visitor info {enrolled.id}</code>. Expires {enrolled.expiresAt}.</p>}</Panel>
    <Panel className="mt-4" title="Recent diagnostic tests"><div className="space-y-1 text-sm">{data?.recent?.map((v) => <p key={v.id} className="flex flex-wrap gap-3 border-b py-2"><code>{v.id.slice(0, 6).toUpperCase()}</code><span>{v.route}</span><span className="text-muted-foreground">{v.lastAt}</span></p>)}</div></Panel>
  </div>;
}
