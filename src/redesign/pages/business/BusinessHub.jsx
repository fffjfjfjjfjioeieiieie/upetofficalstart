import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, Plus, Store, Users } from 'lucide-react';
import { useStore } from '../../lib/store';
import { createBusiness, listBusinessWorkspaces } from '../../lib/businessWorkspace';
import { PageTitle, Panel, Field, inputCls } from '../../components/Controls';
import { Button } from '../../components/ui/button';

export default function BusinessHub() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ businessName: user.profile.shop.name || '', category: 'digital', website: '', description: user.profile.shop.description || '' });
  useEffect(() => { let active = true; listBusinessWorkspaces(user.uid).then((result) => { if (active) setRows(result); }).catch((reason) => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [user.uid]);
  const create = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { navigate(`/business/${await createBusiness(user, form)}/overview`); }
    catch (reason) { setError(reason.message || 'Could not create your business.'); }
    finally { setBusy(false); }
  };
  const ownsBusiness = rows.some((row) => row.ownerUid === user.uid);
  return <section className="mx-auto max-w-6xl px-6 pb-24" data-testid="business-hub">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4"><PageTitle title="Business mode" sub="A separate workspace for your shop and the people who help run it." /><Button asChild variant="outline"><Link to="/dashboard"><ArrowRight className="h-4 w-4 rotate-180" />Personal dashboard</Link></Button></div>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
    {loading ? <p className="text-sm text-muted-foreground">Loading your workspaces…</p> : <div className="grid gap-4 sm:grid-cols-2">{rows.map((business) => <Link key={business.id} to={`/business/${business.id}/overview`} className="group rounded-2xl border border-primary/25 bg-card/80 p-6 transition-colors hover:border-primary/70"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary"><BriefcaseBusiness className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" /></div><h2 className="mt-5 font-display text-lg font-bold">{business.name}</h2><p className="mt-1 text-xs text-muted-foreground">{business.members?.[user.uid]?.role || 'Team member'} · /biz/{business.id}</p><div className="mt-5 flex gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{business.memberUids?.length || 1} people</span><span className="inline-flex items-center gap-1"><Store className="h-3.5 w-3.5" />Open workspace</span></div></Link>)}</div>}
    {!loading && !ownsBusiness && <Panel title="Create your business" desc="Your personal profile stays yours. Your business gets its own team and storefront." className="mt-8"><form onSubmit={create} className="grid gap-4 sm:grid-cols-2"><Field label="Business name"><input required minLength={2} maxLength={100} className={inputCls} value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></Field><Field label="Category"><select className={inputCls} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{[['digital', 'Digital goods'], ['physical', 'Physical goods'], ['services', 'Services'], ['creator', 'Creator business'], ['other', 'Other']].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></Field><Field label="Website (optional)"><input type="url" className={inputCls} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://" /></Field><Field label="What does your business do?"><textarea required minLength={20} maxLength={500} rows={3} className={inputCls} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><div className="sm:col-span-2"><Button disabled={busy}><Plus className="h-4 w-4" />{busy ? 'Creating…' : 'Create business workspace'}</Button></div></form><p className="mt-4 text-xs text-muted-foreground">Business mode is separate from Verified Business review. Creating a workspace does not award a verification mark.</p></Panel>}
  </section>;
}
