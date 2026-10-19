import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BadgeCheck, LockKeyhole, Send, ShieldCheck, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { getBusinessApplication, submitBusinessApplication } from '../lib/businessProgram';
import styles from './BusinessProgram.module.css';

const CATEGORIES = [['digital', 'Digital goods'], ['physical', 'Physical goods'], ['services', 'Services'], ['creator', 'Creator business'], ['other', 'Other']];
const TYPES = [['registered', 'Registered company'], ['sole_trader', 'Sole trader'], ['creator', 'Independent creator'], ['other', 'Other']];
const ROLES = [['owner', 'Owner'], ['co_owner', 'Co-owner'], ['authorized_representative', 'Authorized representative']];
const blankForm = (user) => ({ businessName: user?.profile?.shop?.name || '', category: 'digital', businessType: 'registered', country: '', description: user?.profile?.shop?.description || '', website: '', shopUrl: user?.username ? `https://user.pet/${user.username}/shop` : '', publicProofUrl: '', proofExplanation: '', ownerRole: 'owner', supportEmail: user?.email || '', fulfillment: '' });

export default function BusinessProgram() {
  const { user } = useStore();
  const founder = Boolean(user?.uid && user.role === 'founder');
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(() => blankForm(user));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  useEffect(() => {
    if (!founder) { setApplication(null); setLoading(false); return undefined; }
    let active = true;
    setLoading(true);
    getBusinessApplication(user.uid).then((result) => {
      if (!active) return;
      setApplication(result);
      setForm({ ...blankForm(user), ...result });
      setError('');
    }).catch(() => { if (active) setError('Could not load your application right now.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [founder, user?.uid]);

  const submit = async (event) => {
    event.preventDefault();
    if (!founder || submitting) return;
    setSubmitting(true);
    setError('');
    try { setApplication(await submitBusinessApplication(user, user.username, form)); }
    catch (reason) { setError(reason?.message || 'Could not send your application. Try again.'); }
    finally { setSubmitting(false); }
  };

  return <div className={styles.page} data-testid="business-program">
    <Link className={styles.back} to="/"><ArrowLeft size={16} /> Home</Link>
    <div className={styles.intro}><p className={styles.kicker}><Store size={16} /> Verified Business programme</p><h1>Build trust around your shop.</h1><p>Apply for a separate review of your user.pet shop. We look at who runs it, what it offers, how orders work and public evidence that connects you to the business. Approved shops receive a verified mark.</p><div className={styles.points}><span><ShieldCheck size={17} /> Manual review</span><span><BadgeCheck size={17} /> Storefront badge after approval</span><span><Store size={17} /> A working shop is required</span></div></div>
    {!founder ? <section className={styles.locked}><LockKeyhole size={30} /><h2>Founder access</h2><p>Applications are currently open to invited user.pet founders with a personal profile and shop.</p>{!user ? <Link to="/login?next=/business-verification" className={styles.action}>Sign in to continue <ArrowUpRight size={16} /></Link> : <a href="https://discord.gg/upet" target="_blank" rel="noreferrer" className={styles.action}>Join the community <ArrowUpRight size={16} /></a>}</section> : loading ? <section className={styles.panel}>Loading your application…</section> : application?.status === 'approved' ? <section className={styles.locked}><BadgeCheck size={34} /><h2>Business verified</h2><p>Your shop has been approved for the programme.</p><Link to={`/biz/${user.username}`} className={styles.action}>View business shop <ArrowUpRight size={16} /></Link></section> : <section className={styles.panel}>
      <div className={styles.heading}><div><p className={styles.kicker}>Your application</p><h2>{application ? 'Update your details' : 'Tell us about your business'}</h2></div>{application?.status && <span className={styles.status}>{application.status === 'rejected' ? 'Needs another look' : 'In review'}</span>}</div>
      {application?.status && <p className={styles.note}>{application.status === 'rejected' ? 'You can revise your answers and apply again.' : 'Your application is in review. You can update your answers while you wait.'}</p>}
      <form onSubmit={submit} className={styles.form}>
        <div className={styles.group}><h3>01 / Business identity</h3><p>Tell us what customers should recognize.</p><div className={styles.fields}>
          <label>Business name<input required minLength={2} maxLength={100} value={form.businessName} onChange={setField('businessName')} placeholder="The name customers know" /></label>
          <label>What do you offer?<select value={form.category} onChange={setField('category')}>{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>How do you operate?<select value={form.businessType} onChange={setField('businessType')}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Country or region<input required minLength={2} maxLength={80} value={form.country} onChange={setField('country')} placeholder="Where the business operates" /></label>
          <label className={styles.wide}>What does your business do?<textarea required minLength={20} maxLength={1000} rows={3} value={form.description} onChange={setField('description')} placeholder="Describe what you make or sell and who it is for." /></label>
        </div></div>
        <div className={styles.group}><h3>02 / Shop and customers</h3><p>Share the shop that should receive the badge and how orders are handled.</p><div className={styles.fields}>
          <label>Your user.pet shop URL<input required type="url" maxLength={300} value={form.shopUrl} onChange={setField('shopUrl')} placeholder="https://user.pet/yourname/shop" /></label>
          <label>Business website <small>Optional</small><input type="url" maxLength={300} value={form.website} onChange={setField('website')} placeholder="https://" /></label>
          <label>Customer support email<input required type="email" maxLength={254} value={form.supportEmail} onChange={setField('supportEmail')} placeholder="support@example.com" /></label>
          <label>Your role<select value={form.ownerRole} onChange={setField('ownerRole')}>{ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className={styles.wide}>How do customers receive what they buy?<textarea required minLength={20} maxLength={500} rows={3} value={form.fulfillment} onChange={setField('fulfillment')} placeholder="Explain delivery, access or service completion, including expected timing." /></label>
        </div></div>
        <div className={styles.group}><h3>03 / Public proof</h3><p>Give reviewers a public source that connects you to this business. Do not upload private identity documents.</p><div className={styles.fields}>
          <label className={styles.wide}>Public website or social profile<input required type="url" maxLength={300} value={form.publicProofUrl} onChange={setField('publicProofUrl')} placeholder="https://example.com/your-business" /></label>
          <label className={styles.wide}>How does this link show your connection?<textarea required minLength={30} maxLength={600} rows={3} value={form.proofExplanation} onChange={setField('proofExplanation')} placeholder="Tell us where your business name, ownership or matching shop link appears." /></label>
        </div></div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <div className={styles.submit}><button type="submit" disabled={submitting}><Send size={16} />{submitting ? 'Sending…' : application ? 'Update application' : 'Apply for review'}</button><p>Applications are reviewed manually. Applying does not guarantee verification.</p></div>
      </form>
    </section>}
  </div>;
}
