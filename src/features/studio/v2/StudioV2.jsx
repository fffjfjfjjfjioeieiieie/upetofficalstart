import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, FilePlus2, GripVertical, Layers3, Redo2, Save, Send, Undo2 } from 'lucide-react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../../../shared/ui/index.js';
import { profileDocumentV2Schema } from '../../../shared/contracts/profileV2.js';
import { createDraftSaveCoordinator } from './studioPreviewPolicy.js';
import { addStudioBlock, commitStudioHistory, createStudioHistory, redoStudioHistory, reorderStudioBlocks, undoStudioHistory } from './studioDocumentOps.js';
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

export default function StudioV2({ user, firebaseUser, initialDraft }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(initialDraft.profile);
  const [selectedPageId, setSelectedPageId] = useState(initialDraft.profile.pages[0]?.id);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [saveState, setSaveState] = useState('Saved draft');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedRevision, setPublishedRevision] = useState(initialDraft.basePublishedRevision);
  const profileRef = useRef(initialDraft.profile);
  const draftRevisionRef = useRef(initialDraft.draftRevision);
  const publishedRevisionRef = useRef(initialDraft.basePublishedRevision);
  const historyRef = useRef(createStudioHistory(initialDraft.profile));
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
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,[contenteditable="true"]')) return;
      event.preventDefault();
      applyHistory(event.shiftKey ? 'redo' : 'undo');
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
        <div className="upet-studio-v2__canvas-meta"><span>Canvas · {pageLabel(selectedPage)}</span><span>Desktop preview</span></div>
        <div className="upet-studio-v2__canvas"><div className="upet-studio-v2__profile-card">
          <div className="upet-studio-v2__avatar">{profile.identity.avatarUrl ? <img src={profile.identity.avatarUrl} alt="" /> : profile.identity.displayName.slice(0, 1).toUpperCase()}</div>
          <h2>{profile.identity.displayName}</h2><p className="upet-studio-v2__handle">@{profile.identity.handle}</p>
          <p className="upet-studio-v2__bio">{profile.identity.bio || 'Your story starts here.'}</p>
          {orderedBlocks.length ? <div className="upet-studio-v2__canvas-blocks">{orderedBlocks.filter((block) => block.visible).map((block) => <button type="button" key={block.id} onClick={() => setSelectedBlockId(block.id)} className={selectedBlockId === block.id ? 'is-selected' : ''} aria-label={`Select ${block.type} layer`}>
            {block.type === 'divider' ? <span className="upet-studio-v2__divider" /> : block.type === 'heading' ? <strong>{String(block.data.text || 'Heading')}</strong> : <span>{String(block.data.text || 'Text')}</span>}
          </button>)}</div> : <div className="upet-studio-v2__empty-canvas">Add a heading, text or divider to begin shaping this page.</div>}
        </div></div>
        <p className="upet-studio-v2__canvas-footnote"><Eye size={15} />Private draft preview · published revision {publishedRevision}</p>
      </section>
      <aside className="upet-studio-v2__panel upet-studio-v2__inspector" aria-label="Inspector">
        <div className="upet-studio-v2__panel-heading"><h2>Inspector</h2><span>{selectedBlock ? selectedBlock.type : 'Identity'}</span></div>
        {selectedBlock ? <>
          {selectedBlock.type !== 'divider' && <label>{selectedBlock.type === 'heading' ? 'Heading' : 'Text'}<textarea maxLength={500} rows={4} value={String(selectedBlock.data.text || '')} onChange={(event) => updateBlock('text', event.target.value)} /></label>}
          {selectedBlock.type === 'divider' && <label>Accessible label<input maxLength={80} value={String(selectedBlock.data.label || '')} onChange={(event) => updateBlock('label', event.target.value)} /></label>}
          <Button variant="ghost" size="sm" onClick={() => setSelectedBlockId(null)}>Back to page settings</Button>
        </> : <>
          <label>Display name<input maxLength={80} value={profile.identity.displayName} onChange={(event) => updateIdentity('displayName', event.target.value)} /></label>
          <label>Bio<textarea maxLength={2000} rows={5} value={profile.identity.bio} onChange={(event) => updateIdentity('bio', event.target.value)} /></label>
          <div className="upet-studio-v2__panel-heading upet-studio-v2__section-heading"><h2>Selected page</h2></div>
          <label>Page title<input maxLength={80} value={selectedPage?.title || ''} onChange={(event) => updatePage('title', event.target.value)} /></label>
          <label className="upet-studio-v2__toggle"><input type="checkbox" checked={selectedPage?.visible !== false} onChange={(event) => updatePage('visible', event.target.checked)} />Visible on profile</label>
        </>}
        <Link to="/dashboard/editor" onClick={returnToLegacy} className="upet-studio-v2__legacy">Need a feature from the current editor? Open it here. Your v2 draft stays separate.</Link>
      </aside>
    </div>
  </div>;
}
