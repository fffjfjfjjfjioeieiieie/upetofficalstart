import { createMaterialConfig, MATERIAL_CONTROLS, MATERIAL_VARIANTS, normalizeMaterialConfig } from './materialRegistry.js';

export default function MaterialControls({ value, inheritedValue, allowInherit = false, onChange }) {
  const inherited = allowInherit && !value;
  const settings = normalizeMaterialConfig(value || inheritedValue);
  return <div className="upet-material-controls">
    {allowInherit && <label className="upet-studio-v2__toggle"><input type="checkbox" checked={inherited} onChange={(event) => onChange(event.target.checked ? null : { ...settings }, 'inherit')} />Use profile material</label>}
    {!inherited && <>
      <label>Material<select aria-label={allowInherit ? 'Layer material' : 'Profile material'} value={settings.id} onChange={(event) => onChange(createMaterialConfig(event.target.value), 'id')}>{MATERIAL_VARIANTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      {MATERIAL_CONTROLS.filter((control) => !control.variants || control.variants.includes(settings.id)).map((control) => <label key={control.key}>{control.label}{control.type === 'color'
        ? <input type="color" aria-label={`Material ${control.label.toLowerCase()}`} value={settings[control.key]} onChange={(event) => onChange({ ...settings, [control.key]: event.target.value }, control.key)} />
        : <><input type="range" aria-label={`Material ${control.label.toLowerCase()}`} min={control.min} max={control.max} step={control.step} value={settings[control.key]} onChange={(event) => onChange({ ...settings, [control.key]: Number(event.target.value) }, control.key)} /><output>{settings[control.key]}{control.unit || ''}</output></>}</label>)}
    </>}
  </div>;
}
