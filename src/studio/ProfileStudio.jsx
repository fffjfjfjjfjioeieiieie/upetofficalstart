import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createProfileDocument, migrateProfile, validateProfileForSave } from '../shared/profileSchema.js';
import { getEditableProfile, publishProfile, saveProfile } from '../data/profileStore.js';
import { uploadProfileAsset } from '../data/mediaStore.js';
import StudioToolbar from './StudioToolbar.jsx';
import StudioInspector from './StudioInspector.jsx';
import StudioPreview from './StudioPreview.jsx';
import DashboardNav from '../dashboard/DashboardNav.jsx';
import './ProfileStudio.css';

function setPath(source, path, value) {
  const keys = path.split('.');
  if (keys.length === 1) return { ...source, [path]: value };
  const [head, ...rest] = keys;
  return { ...source, [head]: setPath(source[head], rest.join('.'), value) };
}

export default function ProfileStudio({ username, user, onNavigate, theme = 'dark', onToggleTheme, onLogout }) {
  const [document, setDocument] = useState(() => createProfileDocument({ uid: user.uid, username }));
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState('Loading profile…');
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState(() => { const requested = new URLSearchParams(window.location.search).get('tab'); return ['identity', 'design', 'content', 'media', 'effects', 'entrance', 'advanced'].includes(requested) ? requested : 'identity'; });
  const [selectedId, setSelectedId] = useState('');
  const [device, setDevice] = useState('desktop');
  const [mobilePane, setMobilePane] = useState('edit');
  const [uploads, setUploads] = useState({});
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const latest = useRef(document);
  const saveChain = useRef(Promise.resolve());
  latest.current = document;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const navigate = (path) => { if (!dirty || window.confirm('Your latest changes are not saved yet. Leave the studio?')) onNavigate(path); };

  useEffect(() => {
    let active = true;
    getEditableProfile(user, username).then((saved) => {
      if (!active) return;
      setDocument(saved?.document || migrateProfile(saved || {}));
      setSaveState('Saved'); setReady(true);
    }).catch(() => { if (active) { setReady(true); setSaveState('Could not load saved draft. Refresh to retry.'); } });
    return () => { active = false; };
  }, [user, username]);

  const replaceDocument = useCallback((next) => {
    setHistory((items) => [...items.slice(-39), latest.current]); setFuture([]);
    setDocument(next); setDirty(true); setSaveState('Unsaved changes');
  }, []);
  const set = useCallback((path, value) => replaceDocument(setPath(latest.current, path, value)), [replaceDocument]);
  const undo = () => { if (!history.length) return; setFuture((items) => [latest.current, ...items]); setDocument(history.at(-1)); setHistory(history.slice(0, -1)); setDirty(true); };
  const redo = () => { if (!future.length) return; setHistory((items) => [...items, latest.current]); setDocument(future[0]); setFuture(future.slice(1)); setDirty(true); };

  const save = useCallback(async (source = latest.current) => {
    setSaveState('Saving…');
    try {
      const payload = validateProfileForSave(source);
      saveChain.current = saveChain.current.catch(() => {}).then(() => saveProfile(user, username, payload));
      await saveChain.current;
      if (latest.current === source) { setSaveState('Saved'); setDirty(false); } else setSaveState('Unsaved changes');
      return true;
    }
    catch (error) { setSaveState(error?.message || 'Save failed. Retry.'); return false; }
  }, [user, username]);
  useEffect(() => { if (!ready || !dirty || busy || Object.values(uploads).some(Boolean)) return undefined; const timer = setTimeout(() => save(document), 1200); return () => clearTimeout(timer); }, [document, dirty, ready, busy, save, uploads]);
  const publish = async () => {
    setBusy(true); setSaveState('Publishing…');
    try { await saveChain.current.catch(() => {}); await publishProfile(user, username, document); setDirty(false); setSaveState('Published · live now'); }
    catch (error) { setSaveState(error?.message || 'Could not publish. Retry.'); }
    finally { setBusy(false); }
  };
  const upload = async (kind, file, path) => {
    if (!file) return;
    setUploads((current) => ({ ...current, [kind]: 1 }));
    try {
      const url = await uploadProfileAsset(user, kind, file, (progress) => setUploads((current) => ({ ...current, [kind]: progress })));
      if (path === 'audio.track') {
        const track = { id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, ''), artist: '', url, cover: '' };
        const current = latest.current.audio;
        set('audio', { ...current, enabled: true, tracks: [...current.tracks, track], activeTrackId: track.id });
      } else if (path === 'audio.cover') {
        const current = latest.current.audio;
        set('audio.tracks', current.tracks.map((item) => item.id === current.activeTrackId ? { ...item, cover: url } : item));
      } else if (path === 'background.asset') {
        const current = latest.current.background;
        set('background', { ...current, asset: url, type: file.type.startsWith('video/') ? 'video' : 'image' });
      } else set(path, url);
      setSaveState('Uploaded · saving draft…');
    } catch (error) { setSaveState(error?.message || 'Upload failed. Check Storage configuration.'); }
    finally { setUploads((current) => ({ ...current, [kind]: 0 })); }
  };

  if (!ready) return <div className="studio-loading" role="status">Opening your studio…</div>;
  return <div className="studio-page" data-theme={theme}><DashboardNav username={username} activePath="/customize" theme={theme} onNavigate={navigate} onToggleTheme={onToggleTheme} onLogout={() => { if (!dirty || window.confirm('Your latest changes are not saved yet. Log out?')) onLogout(); }} /><StudioToolbar username={username} onNavigate={navigate} onSave={() => save()} onPublish={publish} onUndo={undo} onRedo={redo} canUndo={Boolean(history.length)} canRedo={Boolean(future.length)} state={saveState} busy={busy || Object.values(uploads).some(Boolean)} />
    <div className="studio-mobile-switch"><button type="button" aria-pressed={mobilePane === 'edit'} onClick={() => setMobilePane('edit')}>Edit</button><button type="button" aria-pressed={mobilePane === 'preview'} onClick={() => setMobilePane('preview')}>Preview</button></div>
    <div className="studio-workspace" data-mobile-pane={mobilePane}><StudioInspector document={document} set={set} replaceDocument={replaceDocument} upload={upload} uploads={uploads} user={user} username={username} tab={tab} setTab={setTab} selectedId={selectedId} setSelectedId={setSelectedId} /><StudioPreview document={document} username={username} user={user} device={device} onDeviceChange={setDevice} onCanvasBlockChange={(id, geometry) => set('blocks', latest.current.blocks.map((block) => block.id === id ? { ...block, style: { ...block.style, ...geometry } } : block))} /></div>
    <div className="studio-mobile-actions"><span role="status">{saveState}</span><button type="button" onClick={() => save()} disabled={busy || Object.values(uploads).some(Boolean)}>Save</button><button className="studio-primary" type="button" onClick={publish} disabled={busy || Object.values(uploads).some(Boolean)}>Publish</button></div>
  </div>;
}
