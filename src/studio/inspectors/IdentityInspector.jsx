import React, { useState } from 'react';
import { Field, Toggle } from '../StudioField.jsx';
import AvatarCropper from '../AvatarCropper.jsx';
import MediaLibrary from '../MediaLibrary.jsx';

export default function IdentityInspector({ document, set, upload, uploads, user }) {
  const value = document.identity;
  const [avatarFile, setAvatarFile] = useState(null);
  return <div className="studio-section"><h2>Identity</h2><p>The first things visitors see.</p>
    <Field label="Display name" value={value.displayName} maxLength={32} onChange={(next) => set('identity.displayName', next)} />
    <Field label="Subtitle" value={value.subtitle} maxLength={80} onChange={(next) => set('identity.subtitle', next)} />
    <Field label="Bio" value={value.bio} multiline maxLength={500} onChange={(next) => set('identity.bio', next)} />
    <div className="studio-row"><Field label="Location" value={value.location} maxLength={64} onChange={(next) => set('identity.location', next)} /><Field label="Status" value={value.statusText} maxLength={48} onChange={(next) => set('identity.statusText', next)} /></div>
    <Field label="Badges" value={value.badges.join(', ')} maxLength={198} help="Up to six, separated by commas" onChange={(next) => set('identity.badges', next.split(',').map((item) => item.trim().slice(0, 32)).filter(Boolean).slice(0, 6))} />
    <label className="studio-upload"><span>Avatar image</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { setAvatarFile(event.target.files?.[0] || null); event.target.value = ''; }} />{uploads.avatar && <small>Uploading {uploads.avatar}%</small>}</label>
    {avatarFile && <AvatarCropper file={avatarFile} onCancel={() => setAvatarFile(null)} onSave={(cropped) => { setAvatarFile(null); upload('avatar', cropped, 'identity.avatar'); }} />}
    <MediaLibrary user={user} kinds={['avatar']} onSelect={(url) => set('identity.avatar', url)} />
    {value.avatar && <button type="button" onClick={() => set('identity.avatar', '')}>Remove avatar</button>}
    <label className="studio-upload"><span>Banner image</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => upload('banner', event.target.files?.[0], 'identity.banner')} />{uploads.banner && <small>Uploading {uploads.banner}%</small>}</label>
    <MediaLibrary user={user} kinds={['banner']} onSelect={(url) => set('identity.banner', url)} />
    <Toggle label="Show banner" checked={value.showBanner} onChange={(next) => set('identity.showBanner', next)} /><Toggle label="Show status" checked={value.showStatus} onChange={(next) => set('identity.showStatus', next)} /><Toggle label="Show location" checked={value.showLocation} onChange={(next) => set('identity.showLocation', next)} />
  </div>;
}
