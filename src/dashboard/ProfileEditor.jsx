import React, { useEffect, useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, ExternalLink, ImagePlus, LayoutTemplate, Link2, LoaderCircle, Monitor, Music2, Plus, Save, Smartphone, Sparkles, Trash2, UploadCloud } from 'lucide-react';
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

const presets = [
  { name: 'Midnight', colors: ['#8fb6ff', '#7c5cff', '#0b101c'], values: { accentColor: '#8fb6ff', secondaryColor: '#7c5cff', surfaceColor: '#0b101c', textColor: '#f7f8fc', backgroundEffect: 'glow', usernameEffect: 'glow', font: 'space' } },
  { name: 'Dreamcore', colors: ['#ff8fa8', '#9b7cff', '#17101f'], values: { accentColor: '#ff8fa8', secondaryColor: '#9b7cff', surfaceColor: '#17101f', textColor: '#fff4f8', backgroundEffect: 'aurora', usernameEffect: 'gradient', font: 'outfit', animatedAccent: true } },
  { name: 'Terminal', colors: ['#6aff9a', '#16b85b', '#07110b'], values: { accentColor: '#6aff9a', secondaryColor: '#16b85b', surfaceColor: '#07110b', textColor: '#dcffe7', backgroundEffect: 'grid', usernameEffect: 'glow', font: 'pixel', borderRadius: 8 } },
  { name: 'Afterdark', colors: ['#ff4f81', '#ff9f43', '#11090e'], values: { accentColor: '#ff4f81', secondaryColor: '#ff9f43', surfaceColor: '#11090e', textColor: '#fff1f6', backgroundEffect: 'stars', usernameEffect: 'gradient', font: 'sora', enableGrain: true } },
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
  const [previewDevice, setPreviewDevice] = useState('desktop');

  useEffect(() => {
    let active = true;
    getEditableProfile(user, username).then((saved) => { if (active && saved) setProfile(saved); }).catch(() => setStatus('Could not load saved settings.')).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, username]);

  const patch = (next) => setProfile((current) => ({ ...current, ...next }));
  const upload = async (kind, file) => {
    const limits = { avatar: 5, banner: 10, cursor: 5, background: 100, audio: 10 };
    if (file.size > limits[kind] * 1024 * 1024) return setStatus(`${kind} files can be up to ${limits[kind]}MB.`);
    const previous = {
      avatar: profile.avatarUrl,
      banner: profile.bannerUrl,
      cursor: profile.cursorUrl,
      background: profile.backgroundUrl,
      audio: profile.audioUrl,
    }[kind];
    const previewUrl = URL.createObjectURL(file);
    if (kind === 'avatar') patch({ avatarUrl: previewUrl });
    if (kind === 'banner') patch({ bannerUrl: previewUrl, showBanner: true });
    if (kind === 'cursor') patch({ cursorUrl: previewUrl, customCursor: true });
    if (kind === 'background') patch({ backgroundUrl: previewUrl, backgroundType: file.type.startsWith('video/') ? 'video' : 'image' });
    if (kind === 'audio') patch({ audioUrl: previewUrl, trackTitle: profile.trackTitle || file.name.replace(/\.[^.]+$/, '') });
    setUploads((current) => ({ ...current, [kind]: 1 }));
    setStatus('');
    try {
      const url = await uploadProfileAsset(user, kind, file, (progress) => setUploads((current) => ({ ...current, [kind]: progress })));
      if (kind === 'avatar') patch({ avatarUrl: url });
      if (kind === 'banner') patch({ bannerUrl: url, showBanner: true });
      if (kind === 'cursor') patch({ cursorUrl: url, customCursor: true });
      if (kind === 'background') patch({ backgroundUrl: url, backgroundType: file.type.startsWith('video/') ? 'video' : 'image' });
      if (kind === 'audio') patch({ audioUrl: url });
      URL.revokeObjectURL(previewUrl);
      setStatus(`${kind} uploaded.`);
    } catch (error) {
      if (kind === 'avatar') patch({ avatarUrl: previous });
      if (kind === 'banner') patch({ bannerUrl: previous });
      if (kind === 'cursor') patch({ cursorUrl: previous });
      if (kind === 'background') patch({ backgroundUrl: previous });
      if (kind === 'audio') patch({ audioUrl: previous });
      URL.revokeObjectURL(previewUrl);
      setStatus(error?.code === 'storage/unauthorized' ? 'Upload permission is not live yet.' : `Could not upload ${kind}.`);
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
            <Field label="Status"><input value={profile.statusText} maxLength={48} placeholder="online" onChange={(e) => patch({ statusText: e.target.value })} /></Field>
            <Field label="Badges" hint="Comma-separated, up to six"><input value={(profile.badges || []).join(', ')} maxLength={120} placeholder="founder, artist, verified" onChange={(e) => patch({ badges: e.target.value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 6) })} /></Field>
            <DropAsset kind="avatar" accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] }} icon={ImagePlus} value={profile.avatarUrl} uploading={uploads.avatar} onFile={(file) => upload('avatar', file)} />
          </Tabs.Content>
          <Tabs.Content value="appearance" className={styles.tabContent}>
            <div className={styles.sectionIntro}><span>02</span><div><h1>Set the whole mood.</h1><p>Color, type, glass, and geometry update instantly.</p></div></div>
            <div className={styles.presetGrid}>{presets.map((preset) => <button type="button" key={preset.name} className={styles.preset} onClick={() => patch(preset.values)}><span>{preset.colors.map((color) => <i key={color} style={{ background: color }} />)}</span><strong>{preset.name}</strong><Sparkles size={13} /></button>)}</div>
            <div className={styles.colorGrid}>{[['Accent', 'accentColor'], ['Secondary', 'secondaryColor'], ['Text', 'textColor'], ['Surface', 'surfaceColor'], ['Visualizer', 'visualizerColor']].map(([label, key]) => <Field key={key} label={label}><div className={styles.colorInput}><input type="color" value={profile[key]} onChange={(e) => patch({ [key]: e.target.value })} /><input value={profile[key]} maxLength={7} onChange={(e) => patch({ [key]: e.target.value })} /></div></Field>)}</div>
            <Field label="Layout"><select value={profile.layout} onChange={(e) => patch({ layout: e.target.value })}><option value="centered">centered</option><option value="spotlight">spotlight</option><option value="minimal">minimal</option></select></Field>
            <Field label="Avatar shape"><select value={profile.avatarShape} onChange={(e) => patch({ avatarShape: e.target.value })}><option value="circle">circle</option><option value="squircle">squircle</option><option value="square">square</option></select></Field>
            <Field label="Font"><select value={profile.font} onChange={(e) => patch({ font: e.target.value })}>{Object.keys(PROFILE_FONTS).map((font) => <option key={font} value={font}>{font}</option>)}</select></Field>
            <NumberSlider label="Card width" value={profile.cardWidth} min={360} max={720} suffix="px" onChange={(cardWidth) => patch({ cardWidth })} />
            <NumberSlider label="Card opacity" value={profile.surfaceOpacity} min={20} max={100} suffix="%" onChange={(surfaceOpacity) => patch({ surfaceOpacity })} />
            <NumberSlider label="Background blur" value={profile.surfaceBlur} min={0} max={40} suffix="px" onChange={(surfaceBlur) => patch({ surfaceBlur })} />
            <NumberSlider label="Corner radius" value={profile.borderRadius} min={0} max={48} suffix="px" onChange={(borderRadius) => patch({ borderRadius })} />
          </Tabs.Content>
          <Tabs.Content value="media" className={styles.tabContent}>
            <div className={styles.sectionIntro}><span>03</span><div><h1>Give it sound and motion.</h1><p>Drop in your own image, video, or audio.</p></div></div>
            <DropAsset kind="background" accept={{ 'image/*': [], 'video/*': [] }} icon={UploadCloud} value={profile.backgroundUrl} uploading={uploads.background} onFile={(file) => upload('background', file)} />
            <DropAsset kind="banner" accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] }} icon={LayoutTemplate} value={profile.bannerUrl} uploading={uploads.banner} onFile={(file) => upload('banner', file)} />
            <DropAsset kind="cursor" accept={{ 'image/*': ['.png', '.webp', '.gif'] }} icon={ImagePlus} value={profile.cursorUrl} uploading={uploads.cursor} onFile={(file) => upload('cursor', file)} />
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
            <Toggle label="Show status" checked={profile.showStatus} onCheckedChange={(showStatus) => patch({ showStatus })} />
            <Toggle label="Show banner" checked={profile.showBanner} onCheckedChange={(showBanner) => patch({ showBanner })} />
            <Toggle label="Show visualizer" checked={profile.showVisualizer} onCheckedChange={(showVisualizer) => patch({ showVisualizer })} />
            <Toggle label="Show volume control" checked={profile.showVolumeControl} onCheckedChange={(showVolumeControl) => patch({ showVolumeControl })} />
            <Toggle label="Interactive 3D tilt" checked={profile.enableTilt} onCheckedChange={(enableTilt) => patch({ enableTilt })} />
            <Toggle label="Film grain" checked={profile.enableGrain} onCheckedChange={(enableGrain) => patch({ enableGrain })} />
            <Toggle label="Animated accent" checked={profile.animatedAccent} onCheckedChange={(animatedAccent) => patch({ animatedAccent })} />
            <Toggle label="Animated browser title" checked={profile.animatedTitle} onCheckedChange={(animatedTitle) => patch({ animatedTitle })} />
            <Toggle label="Custom cursor" checked={profile.customCursor} onCheckedChange={(customCursor) => patch({ customCursor })} />
            <Field label="Entrance text"><input value={profile.enterText} maxLength={48} onChange={(e) => patch({ enterText: e.target.value })} /></Field>
            <Field label="Background effect"><select value={profile.backgroundEffect} onChange={(e) => patch({ backgroundEffect: e.target.value })}><option value="glow">soft glow</option><option value="aurora">aurora</option><option value="stars">stars</option><option value="grid">cyber grid</option><option value="none">none</option></select></Field>
            <Field label="Username effect"><select value={profile.usernameEffect} onChange={(e) => patch({ usernameEffect: e.target.value })}><option value="glow">glow</option><option value="gradient">animated gradient</option><option value="none">none</option></select></Field>
            <Field label="Bio effect"><select value={profile.bioEffect} onChange={(e) => patch({ bioEffect: e.target.value })}><option value="none">none</option><option value="typewriter">typewriter</option></select></Field>
          </Tabs.Content>
          <p className={styles.status} role="status">{status}</p>
        </div>
      </Tabs.Root>
      <aside className={styles.preview}><div className={styles.previewBar}><span>live preview</span><div><button type="button" data-active={previewDevice === 'desktop'} onClick={() => setPreviewDevice('desktop')} aria-label="Desktop preview"><Monitor size={13} /></button><button type="button" data-active={previewDevice === 'mobile'} onClick={() => setPreviewDevice('mobile')} aria-label="Mobile preview"><Smartphone size={13} /></button></div></div><div className={styles.previewStage} data-device={previewDevice}><div className={styles.previewFrame}><PublicProfile profile={{ ...profile, showEnterScreen: false, customCursor: false }} owner={false} onNavigate={() => {}} /></div></div></aside>
    </div>
  </div>;
}

