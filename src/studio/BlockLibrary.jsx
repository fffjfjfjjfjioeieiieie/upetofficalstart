import React, { useState } from 'react';
import { BLOCK_TYPES } from '../shared/profileSchema.js';

const labels = { link: 'Link button', socials: 'Social icons', heading: 'Heading', text: 'Text', image: 'Image', gallery: 'Gallery', video: 'Video', divider: 'Divider', music: 'Music', featured: 'Featured card', skills: 'Skills', project: 'Project', quote: 'Quote', discordPresence: 'Discord presence', discordServer: 'Discord server' };
const groups = { Basics: ['link', 'socials', 'heading', 'text', 'divider'], Media: ['image', 'gallery', 'video', 'music'], Showcase: ['featured', 'skills', 'project', 'quote'], Widgets: ['discordPresence', 'discordServer'] };
export function newBlock(type, order) {
  return { id: crypto.randomUUID(), type, enabled: true, order, style: {}, content: type === 'link' ? { label: 'New link', url: '' } : type === 'heading' ? { text: 'New heading' } : type === 'text' ? { text: 'Tell your story.' } : {} };
}
export default function BlockLibrary({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  return <><button className="studio-primary" type="button" onClick={() => setOpen(true)}>+ Add block</button>{open && <div className="studio-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="studio-dialog" role="dialog" aria-modal="true" aria-label="Add a profile block"><header><h2>Add a block</h2><button type="button" onClick={() => setOpen(false)}>Close</button></header><input autoFocus aria-label="Search blocks" placeholder="Search blocks" value={query} onChange={(event) => setQuery(event.target.value)} />{Object.entries(groups).map(([group, types]) => <div key={group}><h3>{group}</h3><div className="studio-library-grid">{types.filter((type) => labels[type].toLowerCase().includes(query.toLowerCase())).map((type) => <button key={type} type="button" onClick={() => { onAdd(type); setOpen(false); }}>{labels[type]}</button>)}</div></div>)}{!BLOCK_TYPES.some((type) => labels[type]?.toLowerCase().includes(query.toLowerCase())) && <p>No blocks match.</p>}</section></div>}</>;
}
