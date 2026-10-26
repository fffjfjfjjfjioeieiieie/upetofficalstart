import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, FilePlus2, GripVertical, Layers3, Redo2, Save, Send, Undo2 } from 'lucide-react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../../../shared/ui/index.js';
import { profileDocumentV2Schema } from '../../../shared/contracts/profileV2.js';
import EditableCanvasItem from '../../../profiles/layouts/EditableCanvasItem.jsx';
import ProfileRenderer from '../../profiles/renderer/ProfileRenderer.jsx';
import { MATERIAL_VARIANTS } from '../../../graphics/materials/materialRegistry.js';
import { useGraphicsQuality } from '../../../graphics/quality/useGraphicsQuality.js';
import { GraphicsProvider } from '../../../graphics/core/GraphicsProvider.jsx';
import { QUALITY_CHOICES } from '../../../graphics/quality/qualityPreferences.js';
import { createDraftSaveCoordinator } from './studioPreviewPolicy.js';
import { addStudioBlock, applyStudioBlockGeometry, commitStudioHistory, createStudioHistory, patchStudioBlockLayout, redoStudioHistory, reorderStudioBlocks, undoStudioHistory } from './studioDocumentOps.js';
import { submitStudioV2Action } from './studioV2Api.js';
import './studioV2.css';

const pageLabel = (page) => page.title || page.slug || 'Home';

function SortableBlockRow({ block, selected, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .6 : 1 }} className={selected ? 'is-selected' : ''}>
    <button type="button" onClick={onSelect} className="upet-studio-v2__layer-select">{block.type}<span>{block.visible ? 'On' : 'Off'}</span></button>
    <button type="button" className="upet-studio-v2__drag-handle" aria-label={`Move ${block.type} layer`} {...attributes} {...listeners}><GripVertical size={15} /></button>
  </li>;
}

function LayoutNumberField({ label, value, minimum, maximum, onCommit }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    if (draft.trim() === '' || !Number.isFinite(Number(draft))) { setDraft(String(value)); return; }
    onCommit(Number(draft));
  };
  return <label>{label}<input type="number" min={minimum} max={maximum} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></label>;
}

export default function StudioV2(props) {
  return <GraphicsProvider><StudioWorkspace {...props} /></GraphicsProvider>;
}

function StudioWorkspace({ user, firebaseUser, initialDraft }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(initialDraft.profile);
  const [selectedPageId, setSelectedPageId] = useState(initialDraft.profile.pages[0]?.id);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [viewport, setViewport] = useState('desktop');
  const [canvasWidth, setCanvasWidth] = useState(300);
  const graphics = useGraphicsQuality();
  const [saveState, setSaveState] = useState('Saved draft');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedRevision, setPublishedRevision] = useState(initialDraft.basePublishedRevision);
  const profileRef = useRef(initialDraft.profile);
  const draftRevisionRef = useRef(initialDraft.draftRevision);
  const publishedRevisionRef = useRef(initialDraft.basePublishedRevision);
  const historyRef = useRef(createStudioHistory(initialDraft.profile));
  const canvasBlocksRef = useRef(null);
  const coordinatorRef = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  if (!coordinatorRef.current) {
    coordinatorRef.current = createDraftSaveCoordinator({
      save: (nextProfile) => submitStudioV2Action(firebaseUser, {
        action: 'saveDraft',
        username: user.username,
        profile: nextProfile,
        basePublishedRevision: publishedRevisionRef.current,
        expectedDraftRevision: draftRevisionRef.current,
      }),
      onSaved: (result) => {
        draftRevisionRef.current = result.draftRevision;
        setSaveState('Saved draft');
        setError('');
      },
      onError: (reason) => {
        setSaveState('Not saved');
        setError(reason?.status === 409
          ? 'This draft changed in another session. Reload to review it before saving.'
          : reason?.message || 'Draft could not be saved.');
      },
    });
  }

  useEffect(() => {
    const warnUnsaved = (event) => {
      if (!coordinatorRef.current?.hasPending()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnUnsaved);
    return () => {
      window.removeEventListener('beforeunload', warnUnsaved);
      coordinatorRef.current?.dispose();
    };
  }, []);

  const setEditedDocument = (next, group = '') => {
    if (next === profileRef.current || JSON.stringify(next) === JSON.stringify(profileRef.current)) return;
    historyRef.current = commitStudioHistory(historyRef.current, next, { group });
    profileRef.current = next;
    setProfile(next);
    setSaveState('Unsaved changes');
    setError('');
    coordinatorRef.current.enqueue(next);
  };
  const edit = (transform, group = '') => setEditedDocument(profileDocumentV2Schema.parse(transform(profileRef.current)), group);
  const updateIdentity = (field, value) => edit((current) => ({
    ...current, identity: { ...current.identity, [field]: value },
  }), `identity.${field}`);
  const updateMaterial = (id) => edit((current) => ({
    ...current,
    theme: { ...current.theme, material: { ...(current.theme.material || {}), id } },
  }), 'theme.material.id');
  const updatePage = (field, value) => edit((current) => ({
    ...current,
    pages: current.pages.map((page) => page.id === selectedPageId ? { ...page, [field]: value } : page),
  }), `page.${selectedPageId}.${field}`);
  const updateBlock = (field, value) => edit((current) => ({
    ...current,
    pages: current.pages.map((page) => page.id === selectedPageId
      ? { ...page, blocks: page.blocks.map((block) => block.id === selectedBlockId ? { ...block, data: { ...block.data, [field]: value } } : block) }
      : page),
  }), `block.${selectedBlockId}.${field}`);
  const updateLayout = (field, value) => {
    try { setEditedDocument(patchStudioBlockLayout(profileRef.current, selectedPageId, selectedBlockId, viewport, field, value), `layout.${selectedBlockId}.${viewport}.${field}`); }
    catch (reason) { setError(reason?.message || 'Layout value is invalid.'); }
  };
  const applyHistory = (direction) => {
    const next = direction === 'undo' ? undoStudioHistory(historyRef.current) : redoStudioHistory(historyRef.current);
    if (next === historyRef.current) return;
    historyRef.current = next;
    profileRef.current = next.present;
    setProfile(next.present);
    setSaveState('Unsaved changes');
    coordinatorRef.current.enqueue(next.present);
  };
  useEffect(() => {
    const onShortcut = (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,[contenteditable="true"]')) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        applyHistory(event.shiftKey ? 'redo' : 'undo');
        return;
      }
      const arrows = { ArrowLeft: ['x', -1], ArrowRight: ['x', 1], ArrowUp: ['y', -1], ArrowDown: ['y', 1] };
      if (!selectedBlockId || !arrows[event.key] || event.metaKey || event.ctrlKey || event.altKey
        || !(event.target instanceof HTMLElement) || !event.target.closest('.upet-studio-v2__canvas-blocks')) return;
      event.preventDefault();
      const [field, direction] = arrows[event.key];
      const block = profileRef.current.pages.find((page) => page.id === selectedPageId)?.blocks.find((item) => item.id === selectedBlockId);
      if (!block) return;
      const layout = block.layout[viewport] || block.layout.desktop;
      updateLayout(field, layout[field] + direction * (event.shiftKey ? 10 : 1));
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  });
  const addPage = () => {
    let counter = profileRef.current.pages.length + 1;
    while (profileRef.current.pages.some((page) => page.slug === `page-${counter}`)) counter += 1;
    const id = `page-${counter}`;
    edit((current) => ({
      ...current,
      pages: [...current.pages, {
        id, slug: id, title: `Page ${counter}`, order: current.pages.length,
        visible: true, showInNavigation: true, blocks: [],
      }],
    }));
    setSelectedPageId(id);
    setSelectedBlockId(null);
  };
  const addBlock = (type) => {
    try {
      const next = addStudioBlock(profileRef.current, selectedPageId, type);
      setSelectedBlockId(next.pages.find((page) => page.id === selectedPageId).blocks.at(-1).id);
      setEditedDocument(next);
    } catch (reason) { setError(reason?.message || 'Could not add this layer.'); }
  };
  const reorderBlocks = ({ active, over }) => {
    if (!over) return;
    setEditedDocument(reorderStudioBlocks(profileRef.current, selectedPageId, active.id, over.id));
  };
  const commitGeometry = (blockId, geometry) => {
    try { setEditedDocument(applyStudioBlockGeometry(profileRef.current, selectedPageId, blockId, viewport, geometry, canvasWidth)); }
    catch (reason) { setError(reason?.message || 'Canvas layout could not be saved.'); }
  };
  const saveNow = async () => {
    try { await coordinatorRef.current.flush(); }
    catch { /* The coordinator surfaced a precise error and retained the unsaved edit. */ }
  };
  const returnToLegacy = async (event) => {
    event.preventDefault();
    try {
      await coordinatorRef.current.flush();
      navigate('/dashboard/editor');
    } catch { /* Keep the Studio open and show the unsaved-error state. */ }
  };
  const publish = async () => {
    setPublishing(true);
    setError('');
    try {
      await coordinatorRef.current.flush();
      const result = await submitStudioV2Action(firebaseUser, { action: 'publish', username: user.username });
      publishedRevisionRef.current = result.revision;
      setPublishedRevision(result.revision);
      if (Number.isSafeInteger(result.draftRevision)) draftRevisionRef.current = result.draftRevision;
      setSaveState(result.changed ? `Published revision ${result.revision}` : 'Already published');
    } catch (reason) {
      setError(reason?.status === 409
        ? 'Your published profile changed elsewhere. Reload before publishing again.'
        : reason?.message || 'Publish failed. Your current live profile is unchanged.');
    } finally { setPublishing(false); }
  };

  const selectedPage = profile.pages.find((page) => page.id === selectedPageId) || profile.pages[0];
  const orderedBlocks = selectedPage?.blocks.slice().sort((a, b) => a.order - b.order) || [];
  const selectedBlock = orderedBlocks.find((block) => block.id === selectedBlockId);
  const selectedLayout = selectedBlock?.layout[viewport] || selectedBlock?.layout.desktop;
  useEffect(() => {
    const node = canvasBlocksRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => { if (node.clientWidth > 0) setCanvasWidth(node.clientWidth); });
    observer.observe(node);
    if (node.clientWidth > 0) setCanvasWidth(node.clientWidth);
    return () => observer.disconnect();
  }, [selectedPageId, viewport, orderedBlocks.length]);
  return <div className="upet-studio-v2" data-testid="studio-v2">
    <header className="upet-studio-v2__toolbar">
      <div className="upet-studio-v2__title"><Link to="/dashboard/editor" onClick={returnToLegacy} aria-label="Return to current editor" className="upet-studio-v2__back"><ChevronLeft size={18} /></Link><div><p>Founder preview · Studio 2.0</p><h1>Build your world</h1></div></div>
      <div className="upet-studio-v2__actions"><span role="status" aria-live="polite" className="upet-studio-v2__save-state">{saveState}</span><Button variant="ghost" size="icon" aria-label="Undo" title="Undo" disabled={!historyRef.current.past.length} onClick={() => applyHistory('undo')}><Undo2 /></Button><Button variant="ghost" size="icon" aria-label="Redo" title="Redo" disabled={!historyRef.current.future.length} onClick={() => applyHistory('redo')}><Redo2 /></Button><Button variant="outline" size="sm" onClick={saveNow}><Save />Save draft</Button><Button size="sm" disabled={publishing} onClick={publish}><Send />{publishing ? 'Publishing…' : 'Publish'}</Button></div>
    </header>
    {error && <div className="upet-studio-v2__error" role="alert">{error} <button type="button" onClick={saveNow}>Retry save</button></div>}
    <div className="upet-studio-v2__grid">
      <aside className="upet-studio-v2__panel" aria-label="Pages and layers"><div className="upet-studio-v2__panel-heading"><h2>Pages</h2><Button variant="ghost" size="icon" aria-label="Add page" title="Add page" disabled={profile.pages.length >= 20} onClick={addPage}><FilePlus2 /></Button></div>
        <nav aria-label="Profile pages" className="upet-studio-v2__pages">{profile.pages.map((page) => <button type="button" key={page.id} onClick={() => { setSelectedPageId(page.id); setSelectedBlockId(null); }} aria-current={selectedPage?.id === page.id ? 'page' : undefined} className={selectedPage?.id === page.id ? 'is-active' : ''}>{pageLabel(page)}<span>{page.visible ? 'Visible' : 'Hidden'}</span></button>)}</nav>
        <div className="upet-studio-v2__panel-heading upet-studio-v2__layers-heading"><h2><Layers3 size={16} />Layers</h2><span>{selectedPage?.blocks.length || 0}</span></div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderBlocks}><SortableContext items={orderedBlocks.map((block) => block.id)} strategy={verticalListSortingStrategy}><ol className="upet-studio-v2__layers">{orderedBlocks.length ? orderedBlocks.map((block) => <SortableBlockRow key={block.id} block={block} selected={selectedBlockId === block.id} onSelect={() => setSelectedBlockId(block.id)} />) : <li className="is-empty">This page has no blocks yet.</li>}</ol></SortableContext></DndContext>
        <div className="upet-studio-v2__add-blocks"><p>Add a layer</p>{['heading', 'text', 'divider'].map((type) => <Button key={type} variant="outline" size="sm" disabled={orderedBlocks.length >= 100} onClick={() => addBlock(type)}>+ {type}</Button>)}</div>
      </aside>
      <section className="upet-studio-v2__canvas-area" aria-label="Profile canvas">
        <div className="upet-studio-v2__canvas-meta"><span>Canvas · {pageLabel(selectedPage)}</span><div className="upet-studio-v2__viewport-switch" role="group" aria-label="Preview viewport"><button type="button" aria-pressed={viewport === 'desktop'} onClick={() => setViewport('desktop')}>Desktop</button><button type="button" aria-pressed={viewport === 'mobile'} onClick={() => setViewport('mobile')}>Mobile</button></div></div>
        <div className={`upet-studio-v2__canvas ${viewport === 'mobile' ? 'is-mobile' : ''}`}><ProfileRenderer
          source={profile} audience="owner" pageIdOrSlug={selectedPage?.id} viewport={viewport}
          className="upet-studio-v2__profile-card" quality={graphics.tier} reducedMotion={!graphics.motionEnabled}
          blocksRef={canvasBlocksRef} blocksClassName="upet-studio-v2__canvas-blocks"
          emptyContent={<div className="upet-studio-v2__empty-canvas">Add a heading, text or divider to begin shaping this page.</div>}
          renderBlock={({ block, layout, content, style }) => {
            const select = () => setSelectedBlockId(block.id);
            const onKeyDown = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } };
            if (selectedBlockId === block.id) return <EditableCanvasItem geometry={{ x: layout.x / 100 * canvasWidth, y: layout.y, w: Math.min(layout.width, 100 - layout.x) / 100 * canvasWidth, h: Math.max(38, layout.height) }} minWidth={40} minHeight={38} dragGrid={[1, 1]} resizeGrid={[1, 1]} showHandle contentOverflow="visible" onChange={(geometry) => commitGeometry(block.id, geometry)}><div role="button" tabIndex={0} onKeyDown={onKeyDown} className="upet-studio-v2__block-content is-selected" aria-label={`Select ${block.type} layer`} style={{ transform: style.transform }}>{content}</div></EditableCanvasItem>;
            return <div role="button" tabIndex={0} className="upet-studio-v2__block-select" onClick={select} onKeyDown={onKeyDown} aria-label={`Select ${block.type} layer`} style={style}>{content}</div>;
          }}
        /></div>
        <p className="upet-studio-v2__canvas-footnote"><Eye size={15} />Private draft preview · published revision {publishedRevision}</p>
      </section>
      <aside className="upet-studio-v2__panel upet-studio-v2__inspector" aria-label="Inspector">
        <div className="upet-studio-v2__panel-heading"><h2>Inspector</h2><span>{selectedBlock ? selectedBlock.type : 'Identity'}</span></div>
        {selectedBlock ? <>
          {selectedBlock.type !== 'divider' && <label>{selectedBlock.type === 'heading' ? 'Heading' : 'Text'}<textarea aria-label={selectedBlock.type === 'heading' ? 'Heading' : 'Text'} maxLength={500} rows={4} value={String(selectedBlock.data.text || '')} onChange={(event) => updateBlock('text', event.target.value)} /></label>}
          {selectedBlock.type === 'divider' && <label>Accessible label<input maxLength={80} value={String(selectedBlock.data.label || '')} onChange={(event) => updateBlock('label', event.target.value)} /></label>}
          <div className="upet-studio-v2__panel-heading upet-studio-v2__section-heading"><h2>{viewport === 'mobile' ? 'Mobile layout' : 'Desktop layout'}</h2></div>
          <div className="upet-studio-v2__layout-fields">{[
            ['x', 'X position %', 0, 99], ['y', 'Y position', 0, 100000], ['width', 'Width %', 1, 100], ['height', 'Height', 0, 100000], ['rotation', 'Rotation °', -180, 180],
          ].map(([field, label, minimum, maximum]) => <LayoutNumberField key={`${selectedBlockId}:${viewport}:${field}`} label={label} value={selectedLayout[field]} minimum={minimum} maximum={maximum} onCommit={(value) => updateLayout(field, value)} />)}</div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedBlockId(null)}>Back to page settings</Button>
        </> : <>
          <label>Display name<input maxLength={80} value={profile.identity.displayName} onChange={(event) => updateIdentity('displayName', event.target.value)} /></label>
          <label>Bio<textarea aria-label="Bio" maxLength={2000} rows={5} value={profile.identity.bio} onChange={(event) => updateIdentity('bio', event.target.value)} /></label>
          <div className="upet-studio-v2__panel-heading upet-studio-v2__section-heading"><h2>Selected page</h2></div>
          <label>Page title<input maxLength={80} value={selectedPage?.title || ''} onChange={(event) => updatePage('title', event.target.value)} /></label>
          <label className="upet-studio-v2__toggle"><input type="checkbox" checked={selectedPage?.visible !== false} onChange={(event) => updatePage('visible', event.target.checked)} />Visible on profile</label>
          <div className="upet-studio-v2__panel-heading upet-studio-v2__section-heading"><h2>Surface material</h2></div>
          <label>Material<select value={profile.theme?.material?.id || 'matte'} onChange={(event) => updateMaterial(event.target.value)}>{MATERIAL_VARIANTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>Preview quality<select aria-label="Preview quality" value={graphics.preference} onChange={(event) => graphics.setPreference(event.target.value)}>{QUALITY_CHOICES.map((tier) => <option key={tier} value={tier}>{tier[0].toUpperCase() + tier.slice(1)}</option>)}</select></label>
          <label>Motion<select aria-label="Motion" value={graphics.motionPreference} onChange={(event) => graphics.setMotionPreference(event.target.value)}><option value="system">Follow device setting</option><option value="reduce">Reduce motion</option></select></label>
          <p className="upet-studio-v2__quality-note">{graphics.tier} · {graphics.motionEnabled ? 'motion available' : 'static/Lite fallback'} · DPR cap {graphics.budget.maxDpr}</p>
        </>}
        <Link to="/dashboard/editor" onClick={returnToLegacy} className="upet-studio-v2__legacy">Need a feature from the current editor? Open it here. Your v2 draft stays separate.</Link>
      </aside>
    </div>
  </div>;
}
