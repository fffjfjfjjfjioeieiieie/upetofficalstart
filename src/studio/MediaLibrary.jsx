import React, { useState } from 'react';
import { listProfileAssets } from '../data/mediaStore.js';

export default function MediaLibrary({ user, kinds, onSelect }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const show = async () => {
    setOpen(true); setMessage('Loading your uploads…');
    try { const all = await listProfileAssets(user); setItems(all.filter((item) => kinds.includes(item.kind))); setMessage(''); }
    catch { setMessage('Could not load your uploads. Check Storage rules.'); }
  };
  return <><button type="button" onClick={show}>Choose from uploads</button>{open && <div className="studio-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="studio-dialog" role="dialog" aria-modal="true" aria-label="Your uploaded media"><header><h2>Your uploads</h2><button type="button" onClick={() => setOpen(false)}>Close</button></header>{message && <p role="status">{message}</p>}{!message && items.length === 0 && <p>No matching uploads yet.</p>}<div className="studio-media-grid">{items.map((item) => <button key={item.fullPath} type="button" onClick={() => { onSelect(item.url, item.kind); setOpen(false); }}>{['audio'].includes(item.kind) ? <span>♫</span> : ['video'].includes(item.kind) ? <span>▶</span> : <img src={item.url} alt="" loading="lazy" />}<small>{item.name}</small></button>)}</div></section></div>}</>;
}
