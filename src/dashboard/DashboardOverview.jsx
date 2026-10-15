import React from 'react';
import { ArrowRight, ArrowUpRight, Check, Copy, ImagePlus, Link2, Music2, Palette } from 'lucide-react';
import styles from './DashboardOverview.module.css';

const setup = [
  ['avatar', 'Add an avatar', (profile) => Boolean(profile?.avatarUrl)],
  ['bio', 'Write a bio', (profile) => Boolean(profile?.bio?.trim()) && profile.bio !== 'welcome to my corner of user.pet'],
  ['background', 'Choose a background', (profile) => Boolean(profile?.backgroundUrl) || Boolean(profile?.backgroundColor && profile.backgroundColor !== '#080e1b')],
  ['link', 'Add your first link', (profile) => Boolean(profile?.blocks?.length || profile?.links?.length)],
  ['published', 'Publish your profile', (_, status) => Boolean(status?.published)],
];

export default function DashboardOverview({ username, profile, status, analytics, onNavigate }) {
  const url = `https://user.pet/${username}`;
  const completed = setup.filter(([, , check]) => check(profile, status)).length;
  const stepsLeft = setup.length - completed;
  const copy = () => navigator.clipboard?.writeText(url);
  return <div className={styles.overview}>
    <div className={styles.intro}><div><span>YOUR SPACE</span><h2>Welcome back, @{username}.</h2><p>{status?.published ? `Your page is live at ${url}` : 'Your profile is ready to shape. Publish when it feels like yours.'}</p></div><button type="button" onClick={() => onNavigate('/customize')}>Open studio <ArrowRight size={16} /></button></div>
    <div className={styles.metrics}>
      <div><small>PROFILE</small><strong>@{username}</strong></div>
      <div><small>STATUS</small><strong>{status?.published ? 'Published' : 'Draft'}</strong></div>
      <div><small>VIEWS</small><strong>{analytics ? analytics.views : '—'}</strong></div>
      <div><small>CLICKS</small><strong>{analytics ? analytics.clicks : '—'}</strong></div>
    </div>
    <div className={styles.columns}>
      <section className={styles.panel}><div className={styles.panelHead}><span>Profile snapshot</span><button type="button" onClick={() => onNavigate(`/${username}`)}>View page <ArrowUpRight size={14} /></button></div><div className={styles.profileRow}>{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span className={styles.fallbackAvatar}>{username[0]?.toUpperCase()}</span>}<div><strong>{profile?.displayName || username}</strong><small>@{username}</small><p>{profile?.bio || 'Add a short introduction in the studio.'}</p></div></div><div className={styles.url}><span>{url}</span><button type="button" onClick={copy} aria-label="Copy profile link"><Copy size={16} /></button></div></section>
      <section className={styles.panel}><div className={styles.panelHead}><span>Recent performance</span><button type="button" onClick={() => onNavigate('/analytics')}>Analytics <ArrowUpRight size={14} /></button></div>{analytics && analytics.views > 0 ? <div className={styles.performance}><strong>{analytics.views}</strong><span>recorded views</span><small>{analytics.clickRate}% of visitors clicked a link · latest 500 events</small></div> : <div className={styles.empty}>Your real profile activity will appear here after visitors open your published page.</div>}</section>
    </div>
    {stepsLeft > 0 && <section className={styles.panel}><div className={styles.panelHead}><span>Finish your profile</span><small>{completed}/{setup.length} done</small></div><div className={styles.progress}><span style={{ width: `${completed / setup.length * 100}%` }} /></div><div className={styles.checklist}>{setup.map(([id, label, check]) => <button key={id} type="button" onClick={() => onNavigate('/customize')} className={check(profile, status) ? styles.done : ''}><span>{check(profile, status) ? <Check size={15} /> : null}</span>{label}</button>)}</div></section>}
    <section className={styles.quick}><h3>Quick actions</h3><div>{[['Edit identity', ImagePlus, 'identity'], ['Add a link', Link2, 'content'], ['Change design', Palette, 'design'], ['Add music', Music2, 'media']].map(([label, Icon, tab]) => <button key={label} type="button" onClick={() => onNavigate(`/customize?tab=${tab}`)}><Icon size={17} />{label}<ArrowUpRight size={14} /></button>)}</div></section>
  </div>;
}
