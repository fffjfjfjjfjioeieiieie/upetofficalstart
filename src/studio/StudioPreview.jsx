import React from 'react';
import PublicProfile from '../profiles/PublicProfile.jsx';
import { toRendererProfile } from '../shared/profileSchema.js';
export default function StudioPreview({ document, username, user, device, onDeviceChange, onCanvasBlockChange }) {
  return <section className="studio-preview" aria-label="Live profile preview"><div className="studio-preview-top"><span>LIVE PREVIEW</span><div><button type="button" aria-pressed={device === 'desktop'} onClick={() => onDeviceChange('desktop')}>Desktop</button><button type="button" aria-pressed={device === 'mobile'} onClick={() => onDeviceChange('mobile')}>Mobile</button></div></div><div className={`studio-preview-frame ${device}`}><PublicProfile profile={toRendererProfile(document, { uid: user.uid, username })} preview mobilePreview={device === 'mobile'} onCanvasBlockChange={onCanvasBlockChange} onNavigate={() => {}} /></div></section>;
}
