import React from 'react';
import { PROFILE_FONTS } from '../../shared/profileDefaults.js';
import { Choice, Field, Range, Toggle } from '../StudioField.jsx';

const palette = [['Midnight', '#28a8f6', '#a98bea', '#101218'], ['Rose', '#f878ab', '#a98bea', '#1b1019'], ['Signal', '#67e8a0', '#b6ffa9', '#0b1713'], ['Copper', '#f4a261', '#f7ce8f', '#1b1410']];
export default function DesignInspector({ document, set }) {
  const { theme } = document;
  return <div className="studio-section"><h2>Design</h2><p>Pick a foundation, then tune every surface.</p>
    <div className="studio-presets">{palette.map(([name, accent, secondary, surface]) => <button key={name} type="button" onClick={() => { set('theme.colors', { ...theme.colors, accent, secondary, surface }); }}><i style={{ background: `linear-gradient(120deg,${accent},${secondary},${surface})` }} />{name}</button>)}</div>
    <Choice label="Layout" value={theme.layout} options={['focus', 'stack', 'minimal', 'canvas', 'portfolio']} onChange={(next) => set('theme', { ...theme, layout: next, width: next === 'canvas' ? Math.max(theme.width, 800) : theme.width })} />
    <Choice label="Alignment" value={theme.alignment} options={['left', 'center', 'right']} onChange={(next) => set('theme.alignment', next)} />
    <Choice label="Density" value={theme.density} options={['compact', 'comfortable', 'spacious']} onChange={(next) => set('theme.density', next)} />
    <Range label="Page width" value={theme.width} min={320} max={1100} suffix="px" onChange={(next) => set('theme.width', next)} />
    <div className="studio-row">{[['Accent', 'accent'], ['Secondary', 'secondary'], ['Text', 'text'], ['Surface', 'surface']].map(([label, key]) => <Field key={key} label={label} value={theme.colors[key]} type="color" onChange={(next) => set(`theme.colors.${key}`, next)} />)}</div>
    <Choice label="Page font" value={theme.typography.pageFont} options={Object.keys(PROFILE_FONTS)} onChange={(next) => set('theme.typography.pageFont', next)} />
    <Choice label="Display font" value={theme.typography.displayFont} options={Object.keys(PROFILE_FONTS)} onChange={(next) => set('theme.typography.displayFont', next)} />
    <Choice label="Link font" value={theme.typography.linkFont} options={Object.keys(PROFILE_FONTS)} onChange={(next) => set('theme.typography.linkFont', next)} />
    <Range label="Name weight" value={theme.typography.displayWeight} min={300} max={900} onChange={(next) => set('theme.typography.displayWeight', next)} />
    <Range label="Name tracking" value={theme.typography.letterSpacing} min={-4} max={8} suffix="px" onChange={(next) => set('theme.typography.letterSpacing', next)} />
    <Choice label="Name case" value={theme.typography.textCase} options={['normal', 'uppercase', 'lowercase']} onChange={(next) => set('theme.typography.textCase', next)} />
    <Toggle label="Card surface" checked={theme.surface.enabled} onChange={(next) => set('theme.surface.enabled', next)} />
    <Range label="Surface opacity" value={theme.surface.opacity} min={0} max={100} suffix="%" onChange={(next) => set('theme.surface.opacity', next)} />
    <Range label="Surface blur" value={theme.surface.blur} min={0} max={40} suffix="px" onChange={(next) => set('theme.surface.blur', next)} />
    <Range label="Corner radius" value={theme.surface.radius} min={0} max={48} suffix="px" onChange={(next) => set('theme.surface.radius', next)} />
    <Range label="Border width" value={theme.surface.borderWidth} min={0} max={6} suffix="px" onChange={(next) => set('theme.surface.borderWidth', next)} />
    <Field label="Border color" value={theme.surface.borderColor} type="color" onChange={(next) => set('theme.surface.borderColor', next)} />
    <Toggle label="Surface shadow" checked={theme.surface.shadow} onChange={(next) => set('theme.surface.shadow', next)} />
    <Choice label="Button style" value={theme.buttons.style} options={['solid', 'outline', 'soft', 'glass', 'underline', 'icon']} onChange={(next) => set('theme.buttons.style', next)} />
    <div className="studio-row"><Field label="Button fill" value={theme.buttons.background} type="color" onChange={(next) => set('theme.buttons.background', next)} /><Field label="Button text" value={theme.buttons.text} type="color" onChange={(next) => set('theme.buttons.text', next)} /><Field label="Button border" value={theme.buttons.border} type="color" onChange={(next) => set('theme.buttons.border', next)} /></div>
    <Range label="Button radius" value={theme.buttons.radius} min={0} max={40} suffix="px" onChange={(next) => set('theme.buttons.radius', next)} />
    <Choice label="Button hover" value={theme.buttons.hover} options={['none', 'lift', 'scale']} onChange={(next) => set('theme.buttons.hover', next)} />
    <Toggle label="Button shadow" checked={theme.buttons.shadow} onChange={(next) => set('theme.buttons.shadow', next)} />
    <Choice label="Avatar shape" value={theme.avatar.shape} options={['circle', 'squircle', 'square']} onChange={(next) => set('theme.avatar.shape', next)} />
    <Range label="Avatar size" value={theme.avatar.size} min={64} max={180} suffix="px" onChange={(next) => set('theme.avatar.size', next)} />
    <Range label="Avatar zoom" value={theme.avatar.zoom} min={100} max={200} suffix="%" onChange={(next) => set('theme.avatar.zoom', next)} />
    <Range label="Avatar crop X" value={theme.avatar.cropX} min={0} max={100} suffix="%" onChange={(next) => set('theme.avatar.cropX', next)} />
    <Range label="Avatar crop Y" value={theme.avatar.cropY} min={0} max={100} suffix="%" onChange={(next) => set('theme.avatar.cropY', next)} />
    <Range label="Avatar rotation" value={theme.avatar.rotation} min={-180} max={180} suffix="°" onChange={(next) => set('theme.avatar.rotation', next)} />
    <Range label="Avatar border" value={theme.avatar.borderWidth} min={0} max={10} suffix="px" onChange={(next) => set('theme.avatar.borderWidth', next)} />
    <Field label="Avatar border color" value={theme.avatar.borderColor} type="color" onChange={(next) => set('theme.avatar.borderColor', next)} />
    <Toggle label="Avatar glow" checked={theme.avatar.glow} onChange={(next) => set('theme.avatar.glow', next)} />
    <Choice label="Avatar decoration" value={theme.avatar.decoration || 'none'} options={['none', 'halo', 'pulse', 'double-ring']} onChange={(next) => set('theme.avatar.decoration', next)} />
  </div>;
}
