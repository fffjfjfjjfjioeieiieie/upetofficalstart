import React, { useState } from 'react';
import { Choice, Field, Toggle } from '../StudioField.jsx';
import { profileDocumentSchema } from '../../shared/profileSchema.js';
import { createProfileDocument } from '../../shared/profileSchema.js';
import ProfileHistory from '../ProfileHistory.jsx';

const templates = [
  { name: 'Blue hour', layout: 'focus', accent: '#28a8f6', secondary: '#a98bea', surface: '#101218', background: '#080e1b', effect: 'glow' },
  { name: 'Afterdark', layout: 'stack', accent: '#f287ad', secondary: '#d58fea', surface: '#1a111b', background: '#0b0912', effect: 'aurora' },
  { name: 'Signal', layout: 'minimal', accent: '#6bd9a8', secondary: '#a3f7b9', surface: '#0c1712', background: '#07100b', effect: 'grid' },
  { name: 'Portfolio', layout: 'portfolio', accent: '#8ac0ff', secondary: '#e2c69b', surface: '#111620', background: '#0a0e14', effect: 'none' },
];

export default function AdvancedInspector({ document, set, replaceDocument, user, username }) {
  const [message, setMessage] = useState('');
  const [preserveIdentity, setPreserveIdentity] = useState(true);
  const [preserveBlocks, setPreserveBlocks] = useState(true);
  const [preserveMedia, setPreserveMedia] = useState(true);
  const exportProfile = () => {
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a'); link.href = url; link.download = 'userpet-profile.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importProfile = async (file) => {
    if (!file) return;
    try { replaceDocument(profileDocumentSchema.parse(JSON.parse(await file.text()))); setMessage('Profile imported into your draft. Publish to make it live.'); }
    catch { setMessage('This file is not a valid user.pet profile.'); }
  };
  const applyTemplate = (template) => {
    if ((!preserveIdentity || !preserveBlocks || !preserveMedia) && !window.confirm('Applying this template will replace the unchecked profile sections. Continue?')) return;
    const defaults = createProfileDocument();
    const next = structuredClone(document);
    next.theme.layout = template.layout;
    next.theme.colors = { ...next.theme.colors, accent: template.accent, secondary: template.secondary, surface: template.surface };
    next.background.color = template.background;
    next.effects.background = template.effect;
    if (!preserveIdentity) next.identity = defaults.identity;
    if (!preserveBlocks) next.blocks = [];
    if (!preserveMedia) { next.background.asset = ''; next.background.type = 'color'; next.audio = defaults.audio; next.identity.avatar = ''; next.identity.banner = ''; }
    replaceDocument(profileDocumentSchema.parse(next));
    setMessage(`${template.name} applied to your draft. Preview it before publishing.`);
  };
  return <div className="studio-section"><h2>Advanced</h2><p>Search appearance, safety, and portability.</p>
    <div className="studio-divider" /><h3>Templates</h3><p>Choose a foundation while keeping the parts you want.</p>
    <div className="studio-presets">{templates.map((template) => <button key={template.name} type="button" onClick={() => applyTemplate(template)}><i style={{ background: `linear-gradient(120deg,${template.accent},${template.secondary},${template.surface})` }} />{template.name}</button>)}</div>
    <div className="studio-row"><Toggle label="Keep identity" checked={preserveIdentity} onChange={setPreserveIdentity} /><Toggle label="Keep blocks and links" checked={preserveBlocks} onChange={setPreserveBlocks} /><Toggle label="Keep media" checked={preserveMedia} onChange={setPreserveMedia} /></div>
    <Field label="Page title" value={document.seo.title} maxLength={70} onChange={(next) => set('seo.title', next)} />
    <Field label="Page description" value={document.seo.description} maxLength={160} onChange={(next) => set('seo.description', next)} />
    <Field label="Content warning" value={document.safety.contentWarning} maxLength={160} onChange={(next) => set('safety.contentWarning', next)} />
    <Toggle label="Adults-only entry notice" checked={document.safety.ageGate} onChange={(next) => set('safety.ageGate', next)} />
    <Toggle label="Show view counter" checked={document.identity.showViews} onChange={(next) => set('identity.showViews', next)} />
    <Choice label="Link action" value={document.behavior.linkAction} options={[['open', 'Open links'], ['copy', 'Copy links'], ['both', 'Open and copy controls']]} onChange={(next) => set('behavior.linkAction', next)} />
    <Toggle label="Profile analytics" checked={document.behavior.analyticsEnabled} onChange={(next) => set('behavior.analyticsEnabled', next)} />
    <div className="studio-divider" /><h3>Transfer profile</h3><div className="studio-row"><button type="button" onClick={exportProfile}>Export JSON</button><label className="studio-upload">Import JSON<input type="file" accept="application/json,.json" onChange={(event) => importProfile(event.target.files?.[0])} /></label></div>
    <ProfileHistory user={user} username={username} onRestore={replaceDocument} />
    {message && <p role="status">{message}</p>}
  </div>;
}
