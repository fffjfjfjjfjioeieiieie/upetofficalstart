import React from 'react';

export function Field({ label, value, onChange, multiline = false, type = 'text', maxLength, placeholder, help }) {
  const id = React.useId();
  return <label className="studio-field" htmlFor={id}><span>{label}</span>{multiline
    ? <textarea id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} placeholder={placeholder} rows={4} />
    : <input id={id} type={type} value={value ?? ''} onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)} maxLength={maxLength} placeholder={placeholder} />}
    {help && <small>{help}</small>}
  </label>;
}

export function Choice({ label, value, options, onChange }) {
  const id = React.useId();
  return <label className="studio-field" htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={Array.isArray(option) ? option[0] : option} key={Array.isArray(option) ? option[0] : option}>{Array.isArray(option) ? option[1] : option}</option>)}</select></label>;
}

export function Toggle({ label, checked, onChange }) {
  return <label className="studio-toggle"><span>{label}</span><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} /></label>;
}

export function Range({ label, value, min, max, onChange, suffix = '' }) {
  return <label className="studio-field"><span>{label} <output>{value}{suffix}</output></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
