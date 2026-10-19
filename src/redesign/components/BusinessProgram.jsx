import { useEffect, useState } from 'react';
import { ArrowUpRight, BadgeCheck, LockKeyhole, Send, Store } from 'lucide-react';
import { getBusinessApplication, submitBusinessApplication } from '../lib/businessProgram';
import styles from '../pages/Home.module.css';

const CATEGORIES = [['digital', 'Digital goods'], ['physical', 'Physical goods'], ['services', 'Services'], ['creator', 'Creator business'], ['other', 'Other']];

export default function BusinessProgram({ user }) {
  const founder = Boolean(user?.uid && user.role === 'founder');
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState({ businessName: user?.profile?.shop?.name || '', category: 'digital', website: '', description: user?.profile?.shop?.description || '' });
  const [loading, setLoading] = useState(founder);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!founder) { setApplication(null); setLoading(false); return undefined; }
    let active = true;
    setLoading(true);
    getBusinessApplication(user.uid).then((result) => {
      if (!active) return;
      setApplication(result);
      if (result) setForm({ businessName: result.businessName || '', category: result.category || 'other', website: result.website || '', description: result.description || '' });
      else setForm({ businessName: user.profile?.shop?.name || '', category: 'digital', website: '', description: user.profile?.shop?.description || '' });
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

  return <section className={styles.businessSection} aria-labelledby="business-title" data-testid="business-program">
    <div className={styles.businessIntro}><p className={styles.sectionKicker}><Store size={15} /> The business side of user.pet</p><h2 id="business-title">Got a business?</h2><p>Put your shop forward for the separate Verified Business programme. Founders can apply for a review; approved shops receive a verified business mark on their storefront.</p><div className={styles.businessPoints}><span><BadgeCheck size={15} /> Reviewed, not automatic</span><span><Store size={15} /> Built for your shop</span></div></div>
    <div className={styles.businessPanel}>
      {!founder ? <div className={styles.businessLocked}><div className={styles.businessBlur} aria-hidden="true"><span>Business name</span><i /><span>What do you sell?</span><i /><span>Tell us about your shop</span><i /></div><div className={styles.businessLockMessage}><LockKeyhole size={25} /><strong>Founder access</strong><p>Business applications are open to invited user.pet founders.</p><a href="https://discord.gg/upet" target="_blank" rel="noreferrer">Join the community <ArrowUpRight size={15} /></a></div></div> : loading ? <p className={styles.businessStatus}>Loading your application…</p> : application?.status === 'approved' ? <div className={styles.businessResult}><BadgeCheck size={34} /><h3>Business verified</h3><p>Your shop has been approved for the programme.</p></div> : <>
        <div className={styles.businessPanelHeading}><span>Founder application</span>{application?.status && <span className={styles.businessStatusPill}>{application.status === 'rejected' ? 'Needs another look' : 'In review'}</span>}</div>
        {application?.status === 'pending' && <p className={styles.businessHint}>Your application is in review. You can update the details below while you wait.</p>}
        {application?.status === 'rejected' && <p className={styles.businessHint}>You can revise your details and apply again.</p>}
        <form onSubmit={submit} className={styles.businessForm}>
          <label>Business name<input required minLength={2} maxLength={100} value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} placeholder="The name customers know" /></label>
          <label>What do you offer?<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Website or shop link <small>Optional</small><input type="url" maxLength={300} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://" /></label>
          <label>Tell us about your business<textarea required minLength={20} maxLength={1000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What do you make or sell, and where can customers find you?" /></label>
          {error && <p role="alert" className={styles.businessError}>{error}</p>}
          <button type="submit" disabled={submitting} className={styles.primaryButton}><Send size={15} />{submitting ? 'Sending…' : application ? 'Update application' : 'Apply for review'}</button>
        </form><p className={styles.businessFootnote}>Applications are reviewed manually. Applying does not guarantee verification.</p>
      </>}
    </div>
  </section>;
}
