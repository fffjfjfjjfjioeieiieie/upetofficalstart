import React, { useEffect, useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, ExternalLink, ImagePlus, Link2, LoaderCircle, Music2, Plus, Save, Trash2, UploadCloud } from 'lucide-react';
import { getEditableProfile, saveProfile, uploadProfileAsset } from '../data/profileStore.js';
import { PROFILE_FONTS, createDefaultProfile } from '../shared/profileDefaults.js';
import PublicProfile from '../profiles/PublicProfile.jsx';
import styles from './ProfileEditor.module.css';

const sections = [
  ['identity', 'Identity'],
  ['appearance', 'Appearance'],
  ['media', 'Media'],
  ['links', 'Links'],
  ['effects', 'Effects'],
];

function Field({ label, hint, children }) {
  return <label className={styles.field}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function Toggle({ label, checked, onCheckedChange }) {
  return <div className={styles.toggleRow}><span>{label}</span><Switch.Root className={styles.switch} checked={checked} onCheckedChange={onCheckedChange}><Switch.Thumb className={styles.switchThumb} /></Switch.Root></div>;
}

function NumberSlider({ label, value, min, max, suffix = '', onChange }) {
  return <div className={styles.sliderField}><div><span>{label}</span><output>{value}{suffix}</output></div><Slider.Root className={styles.slider} value={[value]} min={min} max={max} step={1} onValueChange={([next]) => onChange(next)}><Slider.Track className={styles.sliderTrack}><Slider.Range className={styles.sliderRange} /></Slider.Track><Slider.Thumb className={styles.sliderThumb} aria-label={label} /></Slider.Root></div>;
}

function DropAsset({ kind, accept, icon: Icon, value, uploading, onFile }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ accept, multiple: false, disabled: uploading, onDropAccepted: ([file]) => onFile(file) });
  return <div {...getRootProps()} className={`${styles.dropzone}${isDragActive ? ` ${styles.dropzoneActive}` : ''}`}><input {...getInputProps()} /><Icon size={22} /><strong>{isDragActive ? 'drop it here' : `drop your ${kind} here`}</strong><span>{value ? 'replace current file' : 'or tap to choose a file'}</span>{uploading && <em><LoaderCircle size={14} /> uploading {uploading}%</em>}</div>;
}

export default function ProfileEditor({ username, user, onNavigate }) {
  const fallback = useMemo(() => createDefaultProfile({ uid: user.uid, username }), [user, username]);
  const [profile, setProfile] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [uploads, setUploads] = useState({});

  useEffect(() => {
    let active = true;
    getEditableProfile(user, username).then((saved) => { if (active && saved) setProfile(saved); }).catch(() => setStatus('Could not load saved settings.')).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, username]);

  const patch = (next) => setProfile((current) => ({ ...current, ...next }));
  const upload = async (kind, file) => {
    const limits = { avatar: 5, background: 100, audio: 10 };
    if (file.size > limits[kind] * 1024 * 1024) return setStatus(`${kind} files can be up to ${limits[kind]}MB.`);
    const previewUrl = URL.createObjectURL(file);
    if (kind === 'avatar') patch({ avatarUrl: previewUrl });
    if (kind === 'background') patch({ backgroundUrl: previewUrl, backgroundType: file.type.startsWith('video/') ? 'video' : 'image' });
    if (kind === 'audio') patch({ audioUrl: previewUrl, trackTitle: profile.trackTitle || file.name.replace(/\.[^.]+$/, '') });
    setUploads((current) => ({ ...current, [kind]: 1 }));
    setStatus('');
    try {
      const url = await uploadProfileAsset(user, kind, file, (progress) => setUploads((current) => ({ ...current, [kind]: progress })));
      if (kind === 'avatar') patch({ avatarUrl: url });
      if (kind === 'background') patch({ backgroundUrl: url, backgroundType: file.type.startsWith('video/') ? 'video' : 'image' });
      if (kind === 'audio') patch({ audioUrl: url });
      setStatus(`${kind} uploaded.`);
    } catch (error) {
      setStatus(error?.code === 'storage/unauthorized' ? 'Upload permission is not live yet. Your preview is still visible.' : `Could not upload ${kind}. Your preview is still visible.`);
    } finally { setUploads((current) => ({ ...current, [kind]: 0 })); }
  };

  const save = async () => {
    setSaving(true); setStatus('');
    try { await saveProfile(user, username, profile); setStatus('Profile saved.'); }
    catch (error) { setStatus(error?.code === 'permission-denied' ? 'Profile permissions are not live yet.' : 'Could not save your profile.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className={styles.loading}>loading your canvas…</div>;

  return <div className={styles.page}>
    <header className={styles.header}><button type="button" onClick={() => onNavigate('/dashboard')}><ArrowLeft size={15} /> dashboard</button><div><span>user.pet/{username}</span><strong>profile studio</strong></div><div className={styles.headerActions}><button type="button" onClick={() => onNavigate(`/${username}`)}>view live <ExternalLink size={13} /></button><button className={styles.saveButton} type="button" onClick={save} disabled={saving}>{saving ? <LoaderCircle size={15} /> : <Save size={15} />}{saving ? 'saving' : 'save changes'}</button></div></header>
    <div className={styles.workspace}>
      <Tabs.Root className={styles.editor} defaultValue="identity">
        <Tabs.List className={styles.tabs} aria-label="Profile customization sections">{sections.map(([value, label]) => <Tabs.Trigger key={value} value={value}>{label}</Tabs.Trigger>)}</Tabs.List>
        <div className={styles.controls}>
          <Tabs.Content value="identity" className={styles.tabContent}>
            <div className={styles.sectionIntro}><span>01</span><div><h1>Make it unmistakably yours.</h1><p>Your public identity appears at user.pet/{username}.</p></div></div>
            <Field label="Display name"><input value={profile.displayName} maxLength={32} onChange={(e) => patch({ displayName: e.target.value })} /></Field>
            <Field label="Bio"><textarea value={profile.bio} maxLength={280} rows={5} onChange={(e) => patch({ bio: e.target.value })} /><small>{profile.bio.length}/280</small></Field>
            <Field label="Location"><input value={profile.location} maxLength={48} placeholder="somewhere online" onChange={(e) => patch({ location: e.target.value })} /></Field>
            <DropAsset kind="avatar" accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] }} icon={ImagePlus} value={profile.avatarUrl} uploading={uploads.avatar} onFile={(file) => upload('avatar', file)} />
          </Tabs.Content>
          <Tabs.Content value="appearance" className={styles.tabContent}>
            <div className={styles.sectionIntro}><span>02</span><div><h1>Set the whole mood.</h1><p>Color, type, glass, and geometry update instantly.</p></div></div>
            <div className={styles.colorGrid}>{[['Accent', 'accentColor'], ['Text', 'textColor'], ['Surface', 'surfaceColor'], ['Visualizer', 'visualizerColor']].map(([label, key]) => <Field key={key} label={label}><div className={styles.colorInput}><input type="color" value={profile[key]} onChange={(e) => patch({ [key]: e.target.value })} /><input value={profile[key]} maxLength={7} onChange={(e) => patch({ [key]: e.target.value })} /></div></Field>)}</div>
            <Field label="Font"><select value={profile.font} onChange={(e) => patch({ font: e.target.value })}>{Object.keys(PROFILE_FONTS).map((font) => <option key={font} value={font}>{font}</option>)}</select></Field>
            <NumberSlider label="Card opacity" value={profile.surfaceOpacity} min={20} max={100} suffix="%" onChange={(surfaceOpacity) => patch({ surfaceOpacity })} />
            <NumberSlider label="Background blur" value={profile.surfaceBlur} min={0} max={40} suffix="px" onChange={(surfaceBlur) => patch({ surfaceBlur })} />
            <NumberSlider label="Corner radius" value={profile.borderRadius} min={0} max={48} suffix="px" onChange={(borderRadius) => patch({ borderRadius })} />
          </Tabs.Content>
          <Tabs.Content value="media" className={styles.tabContent}>
            <div className={styles.sectionIntro}><span>03</span><div><h1>Give it sound and motion.</h1><p>Drop in your own image, video, or audio.</p></div></div>
            <DropAsset kind="background" accept={{ 'image/*': [], 'video/*': [] }} icon={UploadCloud} value={profile.backgroundUrl} uploading={uploads.background} onFile={(file) => upload('background', file)} />
            <DropAsset kind="audio" accept={{ 'audio/*': ['.mp3', '.aac', '.wav', '.m4a', '.ogg'] }} icon={Music2} value={profile.audioUrl} uploading={uploads.audio} onFile={(file) => upload('audio', file)} />
            <div className={styles.twoColumns}><Field label="Track title"><input value={profile.trackTitle} onChange={(e) => patch({ trackTitle: e.target.value })} /></Field><Field label="Artist"><input value={profile.trackArtist} onChange={(e) => patch({ trackArtist: e.target.value })} /></Field></div>
          </Tabs.Content>
          <Tabs.Content value="links" className={styles.tabContent}>
            <div className={styles.sectionIntro}><span>04</span><div><h1>Put everything in one place.</h1><p>Add clean buttons for your socials, projects, or shops.</p></div></div>
            <div className={styles.linkList}>{profile.links.map((link, index) => <div className={styles.linkRow} key={index}><Link2 size={15} /><input aria-label={`Link ${index + 1} label`} placeholder="Label" value={link.label} onChange={(e) => patch({ links: profile.links.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item) })} /><input aria-label={`Link ${index + 1} URL`} placeholder="https://…" value={link.url} onChange={(e) => patch({ links: profile.links.map((item, itemIndex) => itemIndex === index ? { ...item, url: e.target.value } : item) })} /><button type="button" onClick={() => patch({ links: profile.links.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove link ${index + 1}`}><Trash2 size={15} /></button></div>)}</div>
            <button className={styles.addButton} type="button" onClick={() => patch({ links: [...profile.links, { label: '', url: '' }] })} disabled={profile.links.length >= 8}><Plus size={15} /> add link</button>
          </Tabs.Content>
          <Tabs.Content value="effects" className={styles.tabContent}>
            <div className={styles.sectionIntro}><span>05</span><div><h1>Add the final personality.</h1><p>Entrances and effects stay readable and mobile-friendly.</p></div></div>
            <Toggle label="Click-to-enter screen" checked={profile.showEnterScreen} onCheckedChange={(showEnterScreen) => patch({ showEnterScreen })} />
            <Toggle label="Show location" checked={profile.showLocation} onCheckedChange={(showLocation) => patch({ showLocation })} />
            <Toggle label="Show visualizer" checked={profile.showVisualizer} onCheckedChange={(showVisualizer) => patch({ showVisualizer })} />
            <Field label="Entrance text"><input value={profile.enterText} maxLength={48} onChange={(e) => patch({ enterText: e.target.value })} /></Field>
            <Field label="Background effect"><select value={profile.backgroundEffect} onChange={(e) => patch({ backgroundEffect: e.target.value })}><option value="glow">soft glow</option><option value="stars">stars</option><option value="none">none</option></select></Field>
            <Field label="Username effect"><select value={profile.usernameEffect} onChange={(e) => patch({ usernameEffect: e.target.value })}><option value="glow">glow</option><option value="none">none</option></select></Field>
          </Tabs.Content>
          <p className={styles.status} role="status">{status}</p>
        </div>
      </Tabs.Root>
      <aside className={styles.preview}><div className={styles.previewBar}><span>live preview</span><span>desktop · responsive</span></div><div className={styles.previewFrame}><PublicProfile profile={{ ...profile, showEnterScreen: false }} owner={false} onNavigate={() => {}} /></div></aside>
    </div>
  </div>;
}

