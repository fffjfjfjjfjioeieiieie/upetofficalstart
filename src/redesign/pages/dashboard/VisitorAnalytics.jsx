import { useCallback, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Compass, Eye, Globe2, Laptop2, MousePointerClick, RefreshCw, Smartphone } from 'lucide-react';
import { auth } from '../../../app/firebase';
import { PageTitle } from '../../components/Controls';

const COLORS = ['#a69dd2', '#716a9e', '#78a78e', '#c4a36f', '#b77f9f', '#8f8aa8'];
const number = new Intl.NumberFormat('en-GB');

async function loadSummary(days) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in again to view site statistics.');
  const response = await fetch(`/api/visitor?days=${days}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Statistics could not be loaded.');
  return result.summary;
}

const tooltipStyle = { background: '#121019', border: '1px solid rgba(166,157,210,.25)', borderRadius: 12, color: '#fff', fontSize: 12 };
const panel = 'rounded-2xl border border-primary/20 bg-[#0f0d15]/80 p-5 shadow-[0_22px_70px_-50px_rgba(166,157,210,.55)]';

function Trend({ value }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}><Icon className="h-3.5 w-3.5" />{Math.abs(value || 0)}% vs previous period</span>;
}

function Metric({ icon: Icon, label, value, detail, trend, accent = '#a69dd2' }) {
  return <article className={`${panel} relative overflow-hidden`}><span className="absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl" style={{ background: `${accent}20` }} /><div className="relative flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">{label}</p><strong className="mt-3 block text-3xl font-bold tracking-tight text-white">{value}</strong><div className="mt-2 min-h-5">{trend !== undefined ? <Trend value={trend} /> : <span className="text-xs text-muted-foreground">{detail}</span>}</div></div><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ color: accent, background: `${accent}18`, boxShadow: `inset 0 0 0 1px ${accent}25` }}><Icon className="h-5 w-5" /></span></div></article>;
}

function Section({ title, subtitle, children, className = '' }) {
  return <section className={`${panel} ${className}`}><div className="mb-5"><h2 className="font-display text-lg font-bold text-white">{title}</h2>{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}</div>{children}</section>;
}

function countryName(code) {
  if (code === 'Unknown') return 'Unknown';
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch { return code; }
}

function flag(code) {
  return /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...code.split('').map((letter) => 127397 + letter.charCodeAt())) : '◌';
}

function RankedList({ rows = [], names = false, limit = 8 }) {
  const shown = rows.slice(0, limit);
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  if (!shown.length) return <p className="text-sm text-muted-foreground">No data in this period yet.</p>;
  return <div className="space-y-3">{shown.map((row) => { const percent = Math.round((row.value / total) * 100); return <div key={row.name}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate text-white/85">{names && <span className="mr-2">{flag(row.name)}</span>}{names ? countryName(row.name) : row.name}</span><span className="shrink-0 font-mono text-xs text-muted-foreground">{number.format(row.value)} · {percent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-slate-400" style={{ width: `${Math.max(2, percent)}%` }} /></div></div>; })}</div>;
}

export default function VisitorAnalytics() {
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { setSummary(await loadSummary(days)); setError(''); setUpdatedAt(new Date()); }
    catch (exception) { setError(exception.message); }
    finally { setLoading(false); }
  }, [days]);
  useEffect(() => { refresh(); }, [refresh]);

  const daily = useMemo(() => (summary?.daily || []).map((row) => ({ ...row, label: new Date(`${row.name}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) })), [summary]);
  const bestDay = useMemo(() => daily.reduce((best, row) => row.value > (best?.value || -1) ? row : best, null), [daily]);
  const topCountry = summary?.countries?.find((row) => row.name !== 'Unknown') || summary?.countries?.[0];
  const topFeature = summary?.features?.[0];
  const period = summary?.period;

  return <div className="pb-10">
    <div className="flex flex-wrap items-end justify-between gap-5"><PageTitle title="Statistics" sub="Anonymous, aggregate performance across user.pet." /><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-full border border-primary/20 bg-background/70 p-1">{[7, 30, 90].map((value) => <button key={value} type="button" onClick={() => setDays(value)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${days === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white'}`}>{value} days</button>)}</div><button type="button" onClick={() => refresh()} disabled={loading} className="grid h-9 w-9 place-items-center rounded-full border border-primary/20 text-muted-foreground hover:text-primary disabled:opacity-50" aria-label="Refresh statistics"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div></div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Eye} label={`${days}-day views`} value={period ? number.format(period.pageViews) : '—'} trend={period?.viewsChange} />
      <Metric icon={Activity} label="Views today" value={summary ? number.format(summary.today.pageViews) : '—'} detail={bestDay ? `Best day: ${bestDay.label} · ${number.format(bestDay.value)}` : 'Waiting for views'} accent="#8b7cff" />
      <Metric icon={MousePointerClick} label="Feature clicks" value={period ? number.format(period.featureClicks) : '—'} trend={period?.clicksChange} accent="#35d399" />
      <Metric icon={CalendarDays} label="Daily average" value={period ? number.format(period.averageDaily) : '—'} detail={period ? `${period.engagementRate}% feature clicks per view` : '—'} accent="#f7b955" />
    </div>

    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,.7fr)]">
      <Section title="Traffic over time" subtitle={`Daily page views and feature clicks · ${days}-day range`}><div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={daily} margin={{ left: -18, right: 8, top: 8 }}><defs><linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a69dd2" stopOpacity=".42" /><stop offset="1" stopColor="#a69dd2" stopOpacity="0" /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#8f899d', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={22} /><YAxis tick={{ fill: '#8f899d', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="value" name="Views" stroke="#a69dd2" strokeWidth={2.5} fill="url(#viewsFill)" /><Area type="monotone" dataKey="featureClicks" name="Feature clicks" stroke="#78a78e" strokeWidth={1.5} fill="transparent" /></AreaChart></ResponsiveContainer></div></Section>
      <Section title="Highlights" subtitle="What stood out in this period"><div className="space-y-3">{[[Globe2, 'Top country', topCountry ? countryName(topCountry.name) : 'No data', topCountry ? `${number.format(topCountry.value)} views` : '—'], [MousePointerClick, 'Most clicked feature', topFeature?.name || 'Collecting now', topFeature ? `${number.format(topFeature.value)} clicks` : '—'], [CalendarDays, 'Best day', bestDay?.label || 'No data', bestDay ? `${number.format(bestDay.value)} views` : '—']].map(([Icon, label, value, detail]) => <div key={label} className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{label}</p><p className="truncate text-sm font-semibold text-white">{value}</p></div><span className="text-xs text-muted-foreground">{detail}</span></div>)}</div></Section>
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <Section title="Views by country" subtitle="Country-level totals from Vercel; no IP addresses stored" className="xl:col-span-2"><RankedList rows={summary?.countries} names limit={10} /></Section>
      <Section title="Devices" subtitle="Desktop, mobile, and tablet traffic"><div className="h-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={summary?.devices || []} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>{(summary?.devices || []).map((row, index) => <Cell key={row.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-2">{(summary?.devices || []).slice(0, 4).map((row, index) => <div key={row.name} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />{row.name}<strong className="ml-auto text-white">{number.format(row.value)}</strong></div>)}</div></Section>
      <Section title="Most clicked features" subtitle="Useful actions people chose; entry-screen clicks are excluded"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={(summary?.features || []).slice(0, 8)} layout="vertical" margin={{ left: 4, right: 10 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={112} tick={{ fill: '#8d97a5', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" name="Clicks" fill="#35d399" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></Section>
      <Section title="Browsers" subtitle="Browser families used to visit"><RankedList rows={summary?.browsers} limit={7} /></Section>
      <Section title="Referrers" subtitle="Where traffic arrived from"><RankedList rows={summary?.referrers} limit={7} /></Section>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Compass className="h-3.5 w-3.5" />Aggregate totals only. No IP addresses or individual browsing histories are stored.</span><span className="flex items-center gap-2">{days <= 7 ? <Smartphone className="h-3.5 w-3.5" /> : <Laptop2 className="h-3.5 w-3.5" />}{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading…'}</span></div>
  </div>;
}
