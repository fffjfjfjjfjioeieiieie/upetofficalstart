import React from 'react';
import BlockLibrary, { newBlock } from './BlockLibrary.jsx';
import BlockList from './BlockList.jsx';
import IdentityInspector from './inspectors/IdentityInspector.jsx';
import DesignInspector from './inspectors/DesignInspector.jsx';
import MediaInspector from './inspectors/MediaInspector.jsx';
import EffectsInspector from './inspectors/EffectsInspector.jsx';
import AdvancedInspector from './inspectors/AdvancedInspector.jsx';
import EntranceInspector from './inspectors/EntranceInspector.jsx';
import BlockInspector from './inspectors/blocks/BlockInspector.jsx';

const editorTabs = [['identity', 'Profile & assets'], ['design', 'Layout & style'], ['effects', 'Effects & FX'], ['entrance', 'Entry screen'], ['advanced', 'Advanced']];
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
