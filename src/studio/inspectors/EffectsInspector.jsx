import React, { useState } from 'react';
import { Choice, Range, Toggle } from '../StudioField.jsx';
import MediaLibrary from '../MediaLibrary.jsx';

const effects = ['none', 'typewriter', 'shake', 'rainbow', 'sparkle', 'shine', 'glow', 'glitch', 'scramble', 'flicker', 'loading', 'blackout', 'neon', 'reactive'];
const categories = { Motion: ['shake', 'flicker', 'loading'], 'Glow & light': ['rainbow', 'sparkle', 'shine', 'glow', 'neon'], Glitch: ['glitch', 'scramble', 'blackout'], Type: ['typewriter'], Reactive: ['reactive'] };
function EffectBrowser({ label, value, sample, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  return <div className="studio-effect"><div><strong>{label}</strong><span>{value}</span><button type="button" onClick={() => setOpen(true)}>Change effect</button></div>{open && <div className="studio-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}><section className="studio-dialog studio-effect-dialog" role="dialog" aria-modal="true" aria-label={`${label} effects`}><header><div><small>EFFECTS / {label.toUpperCase()}</small><h2>Text effects</h2></div><button type="button" onClick={() => setOpen(false)}>Close</button></header><p>Previewing with your own profile text. Select an effect to use it, or select it again to clear it.</p><div className="studio-effect-picker"><input autoFocus aria-label={`Search ${label} effects`} value={query} placeholder="Search effects" onChange={(event) => setQuery(event.target.value)} /><div><button type="button" aria-pressed={value === 'none'} onClick={() => onChange('none')}><span>{sample}</span><small>None</small></button></div>{Object.entries(categories).map(([group, names]) => { const choices = names.filter((effect) => effects.includes(effect) && effect.includes(query.toLowerCase())); return choices.length ? <section key={group}><h3>{group}</h3><div>{choices.map((effect) => <button type="button" key={effect} aria-pressed={value === effect} onClick={() => onChange(value === effect ? 'none' : effect)}><span data-effect={effect}>{sample}</span><small>{effect}</small></button>)}</div></section> : null; })}</div><footer><span>Continuous effects pause when reduced motion is enabled.</span><button type="button" onClick={() => setOpen(false)}>Done</button></footer></section></div>}</div>;
}
export default function EffectsInspector({ document, set, upload, uploads, user }) {
  const { effects } = document;
  const name = document.identity.displayName || 'your name';
  return <div className="studio-section"><h2>Effects</h2><p>Each effect has its own target. Keep motion comfortable for your visitors.</p>
    <EffectBrowser label="Display name" value={effects.displayName} sample={name} onChange={(next) => set('effects.displayName', next)} />
    <EffectBrowser label="Username" value={effects.username} sample={`@${document.identity.displayName || 'username'}`} onChange={(next) => set('effects.username', next)} />
    <EffectBrowser label="Bio" value={effects.bio} sample="Your story" onChange={(next) => set('effects.bio', next)} />
    <Choice label="Background effect" value={effects.background} options={['none', 'glow', 'stars', 'grid', 'aurora', 'gradient-motion', 'rain', 'particles']} onChange={(next) => set('effects.background', next)} />
    <Choice label="Card effect" value={effects.card} options={['none', 'glow', 'float']} onChange={(next) => set('effects.card', next)} />
    <Choice label="Foreground overlay" value={effects.overlay} options={['none', 'vignette', 'scanlines']} onChange={(next) => set('effects.overlay', next)} />
    <Toggle label="Card tilt" checked={effects.enableTilt} onChange={(next) => set('effects.enableTilt', next)} />
    <Toggle label="Grain overlay" checked={effects.grain} onChange={(next) => set('effects.grain', next)} />
    <Toggle label="Animated accent" checked={effects.animatedAccent} onChange={(next) => set('effects.animatedAccent', next)} />
    <Toggle label="Reduced motion mode" checked={effects.reducedMotionMode} onChange={(next) => set('effects.reducedMotionMode', next)} />
    <Range label="Intensity" value={effects.intensity} min={0} max={100} suffix="%" onChange={(next) => set('effects.intensity', next)} />
    <Range label="Animation speed" value={effects.animationSpeed} min={25} max={200} suffix="%" onChange={(next) => set('effects.animationSpeed', next)} />
    <div className="studio-divider" /><h3>Pointer and clicks</h3>
    <Toggle label="Custom cursor" checked={effects.customCursor} onChange={(next) => set('effects.customCursor', next)} />
    <label className="studio-upload"><span>Cursor image</span><input type="file" accept="image/png,image/webp,image/gif" onChange={(event) => upload('cursor', event.target.files?.[0], 'effects.cursor')} />{uploads.cursor && <small>Uploading {uploads.cursor}%</small>}</label>
    <MediaLibrary user={user} kinds={['cursor']} onSelect={(url) => set('effects.cursor', url)} />
    <div className="studio-row"><Range label="Cursor hotspot X" value={effects.cursorHotspotX} min={0} max={128} suffix="px" onChange={(next) => set('effects.cursorHotspotX', next)} /><Range label="Cursor hotspot Y" value={effects.cursorHotspotY} min={0} max={128} suffix="px" onChange={(next) => set('effects.cursorHotspotY', next)} /></div>
  </div>;
}
