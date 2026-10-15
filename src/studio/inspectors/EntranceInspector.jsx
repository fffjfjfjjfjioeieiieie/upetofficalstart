import React from 'react';
import { Choice, Field, Toggle } from '../StudioField.jsx';
export default function EntranceInspector({ document, set }) {
  const value = document.entrance;
  return <div className="studio-section"><h2>Entry screen</h2><p>Give visitors a clear first step before media starts.</p>
    <Toggle label="Click to enter" checked={value.enabled} onChange={(next) => set('entrance.enabled', next)} />
    <Field label="Title" value={value.title} maxLength={80} onChange={(next) => set('entrance.title', next)} />
    <Field label="Subtitle" value={value.subtitle} maxLength={120} onChange={(next) => set('entrance.subtitle', next)} />
    <Field label="Button label" value={value.buttonLabel} maxLength={48} onChange={(next) => set('entrance.buttonLabel', next)} />
    <Choice label="Transition" value={value.transition} options={['fade', 'scale', 'slide']} onChange={(next) => set('entrance.transition', next)} />
    <p>Audio can start after the visitor taps Enter. Browser settings may still block autoplay.</p>
  </div>;
}
