import React from 'react';
import BlockLibrary, { newBlock } from './BlockLibrary.jsx';
import BlockList from './BlockList.jsx';
import { Field } from './StudioField.jsx';
import IdentityInspector from './inspectors/IdentityInspector.jsx';
import DesignInspector from './inspectors/DesignInspector.jsx';
import MediaInspector from './inspectors/MediaInspector.jsx';
import EffectsInspector from './inspectors/EffectsInspector.jsx';
import AdvancedInspector from './inspectors/AdvancedInspector.jsx';
import EntranceInspector from './inspectors/EntranceInspector.jsx';
import { blockGeometry } from '../profiles/layouts/CanvasBlocks.jsx';

const editorTabs = [['identity', 'Profile & assets'], ['design', 'Layout & style'], ['effects', 'Effects & FX'], ['entrance', 'Entry screen'], ['advanced', 'Advanced']];
function BlockInspector({ block, onChange, canvas }) {
  const setContent = (key, value) => onChange({ ...block, content: { ...block.content, [key]: value } });
  const textFields = {
    link: [['label', 'Label'], ['url', 'Destination URL']], socials: [['items', 'Socials, one Label | URL per line']], heading: [['text', 'Heading']], text: [['text', 'Markdown text']], image: [['url', 'Image URL'], ['alt', 'Alt text']], gallery: [['urls', 'Image URLs, one per line']], video: [['url', 'Video or embed URL']], music: [['url', 'Audio URL'], ['title', 'Title'], ['artist', 'Artist']], featured: [['title', 'Title'], ['description', 'Description'], ['url', 'Destination URL']], skills: [['text', 'Skills, separated by commas']], project: [['title', 'Project title'], ['description', 'Description'], ['url', 'Destination URL']], quote: [['text', 'Quote'], ['author', 'Attribution']], discordPresence: [['userId', 'Discord user ID']], discordServer: [['url', 'Discord invite URL'], ['label', 'Server name']],
  }[block.type] || [];
  const geometry = blockGeometry(block, block.order);
  return <div className="studio-block-inspector"><h3>Edit {block.type}</h3>{textFields.map(([key, label]) => <Field key={key} label={label} value={block.content?.[key] || ''} multiline={key === 'text' || key === 'description' || key === 'urls' || key === 'items'} maxLength={key === 'text' ? 5000 : key === 'items' || key === 'urls' ? 4000 : 2048} onChange={(next) => setContent(key, next)} />)}{block.type === 'divider' && <p>A simple visual break between blocks.</p>}{canvas && <><h3>Desktop position</h3><p>Drag this block in the preview or enter precise values. Mobile follows block order.</p><div className="studio-row">{[['X', 'x'], ['Y', 'y'], ['Width', 'w'], ['Height', 'h']].map(([label, key]) => <Field key={key} label={label} value={geometry[key]} type="number" onChange={(next) => onChange({ ...block, style: { ...block.style, [key]: Math.max(key === 'w' ? 160 : key === 'h' ? 60 : 0, next) } })} />)}</div></>}</div>;
}
export default function StudioInspector({ document, set, replaceDocument, upload, uploads, user, username, tab, setTab, selectedId, setSelectedId }) {
  const selected = document.blocks.find((block) => block.id === selectedId);
  const setBlocks = (blocks) => set('blocks', blocks);
  const area = tab === 'content' ? 'links' : tab === 'media' ? 'widgets' : 'editor';
  return <section className="studio-inspector"><div className="studio-main-tabs" role="tablist" aria-label="Studio areas"><button role="tab" aria-selected={area === 'editor'} type="button" onClick={() => setTab('identity')}>Editor</button><button role="tab" aria-selected={area === 'links'} type="button" onClick={() => setTab('content')}>Links & blocks</button><button role="tab" aria-selected={area === 'widgets'} type="button" onClick={() => setTab('media')}>Widgets & music</button></div>{area === 'editor' && <div className="studio-tabs" role="tablist" aria-label="Editor sections">{editorTabs.map(([value, label]) => <button key={value} role="tab" aria-selected={tab === value} type="button" onClick={() => setTab(value)}>{label}</button>)}</div>}<div className="studio-inspector-scroll">
    {tab === 'identity' && <IdentityInspector document={document} set={set} upload={upload} uploads={uploads} user={user} />}
    {tab === 'design' && <DesignInspector document={document} set={set} />}
    {tab === 'content' && <div className="studio-section"><div className="studio-content-head"><div><h2>Content</h2><p>Build your page from reorderable blocks.</p></div><BlockLibrary onAdd={(type) => { const block = newBlock(type, document.blocks.length); setBlocks([...document.blocks, block]); setSelectedId(block.id); }} /></div><BlockList blocks={document.blocks} selectedId={selectedId} onSelect={setSelectedId} onChange={setBlocks} />{selected && <BlockInspector block={selected} canvas={document.theme.layout === 'canvas'} onChange={(next) => setBlocks(document.blocks.map((block) => block.id === selected.id ? next : block))} />}</div>}
    {tab === 'media' && <MediaInspector document={document} set={set} upload={upload} uploads={uploads} user={user} />}
    {tab === 'effects' && <EffectsInspector document={document} set={set} upload={upload} uploads={uploads} user={user} />}
    {tab === 'entrance' && <EntranceInspector document={document} set={set} />}
    {tab === 'advanced' && <AdvancedInspector document={document} set={set} replaceDocument={replaceDocument} user={user} username={username} />}
  </div></section>;
}
