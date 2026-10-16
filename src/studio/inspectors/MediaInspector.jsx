import React from 'react';
import { Choice, Field, Range, Toggle } from '../StudioField.jsx';
import MediaLibrary from '../MediaLibrary.jsx';
import MediaDropzone from '../MediaDropzone.jsx';

export default function MediaInspector({ document, set, upload, uploads, user }) {
  const { background, audio } = document;
  const track = audio.tracks.find((item) => item.id === audio.activeTrackId) || audio.tracks[0];
  const updateTrack = (patch) => {
    const next = { id: track?.id || crypto.randomUUID(), title: track?.title || '', artist: track?.artist || '', url: track?.url || '', cover: track?.cover || '', ...patch };
    set('audio', { ...audio, enabled: true, tracks: track ? audio.tracks.map((item) => item.id === track.id ? next : item) : [...audio.tracks, next], activeTrackId: next.id });
  };
  return <div className="studio-section"><h2>Media</h2><p>Image, video, and music are yours to upload.</p>
    <Choice label="Background type" value={background.type} options={['color', 'gradient', 'image', 'video']} onChange={(next) => set('background.type', next)} />
    <Field label="Background color" value={background.color} type="color" onChange={(next) => set('background.color', next)} />
    {background.type === 'gradient' && <Field label="CSS gradient" value={background.gradient} maxLength={200} onChange={(next) => set('background.gradient', next)} help="Use a linear-gradient or radial-gradient value." />}
    <MediaDropzone label="Background image or video" hint="Drop a PNG, JPG, WebP, GIF, MP4, or WebM." accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'], 'image/gif': ['.gif'], 'video/mp4': ['.mp4'], 'video/webm': ['.webm'] }} onFile={(file) => upload('background', file, 'background.asset')} progress={uploads.background} />
    <MediaLibrary user={user} kinds={['background']} onSelect={(url) => set('background', { ...background, asset: url, type: /\.(mp4|webm)(\?|$)/i.test(url) ? 'video' : 'image' })} />
    <Range label="Overlay" value={background.overlayOpacity} min={0} max={100} suffix="%" onChange={(next) => set('background.overlayOpacity', next)} />
    <Field label="Overlay color" value={background.overlay} type="color" onChange={(next) => set('background.overlay', next)} />
    <Range label="Blur" value={background.blur} min={0} max={40} suffix="px" onChange={(next) => set('background.blur', next)} />
    <Range label="Brightness" value={background.brightness} min={0} max={200} suffix="%" onChange={(next) => set('background.brightness', next)} />
    <Range label="Saturation" value={background.saturation} min={0} max={200} suffix="%" onChange={(next) => set('background.saturation', next)} />
    <Choice label="Image fit" value={background.fit} options={['cover', 'contain']} onChange={(next) => set('background.fit', next)} />
    <Range label="Background scale" value={background.scale} min={50} max={200} suffix="%" onChange={(next) => set('background.scale', next)} />
    <div className="studio-row"><Range label="Focus X" value={background.positionX} min={0} max={100} suffix="%" onChange={(next) => set('background.positionX', next)} /><Range label="Focus Y" value={background.positionY} min={0} max={100} suffix="%" onChange={(next) => set('background.positionY', next)} /></div>
    <div className="studio-divider" /><h3>Music player</h3>
    <Toggle label="Enable music" checked={audio.enabled} onChange={(next) => set('audio.enabled', next)} />
    <MediaDropzone label="Add audio track" hint="Drop an MP3, WAV, OGG, M4A, or AAC track." accept={{ 'audio/mpeg': ['.mp3'], 'audio/wav': ['.wav'], 'audio/ogg': ['.ogg'], 'audio/mp4': ['.m4a', '.mp4'], 'audio/aac': ['.aac'] }} onFile={(file) => upload('audio', file, 'audio.track')} progress={uploads.audio} />
    {audio.tracks.length > 0 && <div className="studio-track-list" aria-label="Audio playlist">{audio.tracks.map((item, index) => <div key={item.id}><button type="button" onClick={() => set('audio.activeTrackId', item.id)} aria-pressed={audio.activeTrackId === item.id}>{item.title || 'Untitled track'}{audio.activeTrackId === item.id ? ' · active' : ''}</button><button type="button" disabled={index === 0} aria-label={`Move ${item.title} up`} onClick={() => { const tracks = [...audio.tracks]; [tracks[index - 1], tracks[index]] = [tracks[index], tracks[index - 1]]; set('audio.tracks', tracks); }}>↑</button><button type="button" disabled={index === audio.tracks.length - 1} aria-label={`Move ${item.title} down`} onClick={() => { const tracks = [...audio.tracks]; [tracks[index], tracks[index + 1]] = [tracks[index + 1], tracks[index]]; set('audio.tracks', tracks); }}>↓</button><button type="button" aria-label={`Remove ${item.title}`} onClick={() => { const tracks = audio.tracks.filter((trackItem) => trackItem.id !== item.id); set('audio', { ...audio, tracks, activeTrackId: item.id === audio.activeTrackId ? tracks[0]?.id || '' : audio.activeTrackId, enabled: tracks.length > 0 }); }}>×</button></div>)}</div>}
    {audio.tracks.length > 1 && <Choice label="Active track" value={audio.activeTrackId} options={audio.tracks.map((item) => [item.id, item.title || 'Untitled'])} onChange={(next) => set('audio.activeTrackId', next)} />}
    <div className="studio-row"><Field label="Title" value={track?.title || ''} maxLength={100} onChange={(next) => updateTrack({ title: next })} /><Field label="Artist" value={track?.artist || ''} maxLength={100} onChange={(next) => updateTrack({ artist: next })} /></div>
    {track && <label className="studio-upload"><span>Track cover</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload('cover', event.target.files?.[0], 'audio.cover')} />{uploads.cover && <small>Uploading {uploads.cover}%</small>}</label>}
    <Choice label="Player style" value={audio.playerStyle} options={['compact', 'full', 'minimal']} onChange={(next) => set('audio.playerStyle', next)} />
    <Choice label="Player position" value={audio.position} options={['card', 'floating']} onChange={(next) => set('audio.position', next)} />
    <Toggle label="Loop track" checked={audio.loop} onChange={(next) => set('audio.loop', next)} />
    <Toggle label="Shuffle playlist" checked={audio.shuffle} onChange={(next) => set('audio.shuffle', next)} />
    <Toggle label="Show progress" checked={audio.showProgress} onChange={(next) => set('audio.showProgress', next)} />
    <Toggle label="Show waveform" checked={audio.showWaveform} onChange={(next) => set('audio.showWaveform', next)} />
    <Toggle label="Show visualizer" checked={audio.showVisualizer} onChange={(next) => set('audio.showVisualizer', next)} />
    <Toggle label="Show volume control" checked={audio.showVolumeControl} onChange={(next) => set('audio.showVolumeControl', next)} />
    <Field label="Visualizer color" value={document.theme.colors.visualizer} type="color" onChange={(next) => set('theme.colors.visualizer', next)} />
    <Toggle label="Visualizer gradient" checked={audio.visualizerGradient} onChange={(next) => set('audio.visualizerGradient', next)} />
    <Choice label="Visualizer placement" value={audio.visualizerPlacement} options={['player', 'background']} onChange={(next) => set('audio.visualizerPlacement', next)} />
    <Range label="Visualizer intensity" value={audio.visualizerIntensity} min={0} max={100} suffix="%" onChange={(next) => set('audio.visualizerIntensity', next)} />
    <Range label="Visualizer smoothing" value={audio.visualizerSmoothing} min={0} max={100} suffix="%" onChange={(next) => set('audio.visualizerSmoothing', next)} />
    <Range label="Starting volume" value={audio.volume} min={0} max={100} suffix="%" onChange={(next) => set('audio.volume', next)} />
  </div>;
}
