import React from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const names = { link: 'Link button', socials: 'Social icons', heading: 'Heading', text: 'Text', image: 'Image', gallery: 'Gallery', video: 'Video', divider: 'Divider', music: 'Music', featured: 'Featured card', skills: 'Skills', project: 'Project', quote: 'Quote', discordPresence: 'Discord presence', discordServer: 'Discord server' };
function Row({ block, selected, select, duplicate, remove, toggle, move, first, last }) {
  const sortable = useSortable({ id: block.id });
  return <div ref={sortable.setNodeRef} className={`studio-block-row${selected ? ' selected' : ''}`} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition, opacity: sortable.isDragging ? .55 : 1 }}>
    <button type="button" className="studio-grab" ref={sortable.setActivatorNodeRef} {...sortable.attributes} {...sortable.listeners} aria-label={`Drag ${names[block.type]}`}>⠿</button>
    <button type="button" className="studio-block-name" onClick={() => select(block.id)}><strong>{block.content?.label || block.content?.text || names[block.type]}</strong><small>{names[block.type]}{block.enabled ? '' : ' · hidden'}</small></button>
    <div className="studio-block-actions"><button type="button" disabled={first} onClick={() => move(block.id, -1)} aria-label="Move up">↑</button><button type="button" disabled={last} onClick={() => move(block.id, 1)} aria-label="Move down">↓</button><button type="button" onClick={() => toggle(block.id)} aria-label={block.enabled ? 'Hide block' : 'Show block'}>{block.enabled ? '◉' : '○'}</button><button type="button" onClick={() => duplicate(block.id)} aria-label="Duplicate block">⧉</button><button type="button" onClick={() => remove(block.id)} aria-label="Delete block">×</button></div>
  </div>;
}
export default function BlockList({ blocks, selectedId, onSelect, onChange }) {
  const ordered = [...blocks].sort((a, b) => a.order - b.order);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const reorder = (from, to) => onChange(arrayMove(ordered, from, to).map((block, order) => ({ ...block, order })));
  const move = (id, by) => { const index = ordered.findIndex((block) => block.id === id); if (index + by >= 0 && index + by < ordered.length) reorder(index, index + by); };
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => { if (over && active.id !== over.id) reorder(ordered.findIndex((block) => block.id === active.id), ordered.findIndex((block) => block.id === over.id)); }}><SortableContext items={ordered.map((block) => block.id)} strategy={verticalListSortingStrategy}><div className="studio-block-list">{ordered.length === 0 && <p>No blocks yet. Add a link, text, or media block to start.</p>}{ordered.map((block, index) => <Row key={block.id} block={block} selected={selectedId === block.id} select={onSelect} move={move} first={index === 0} last={index === ordered.length - 1} duplicate={(id) => { const original = ordered.find((item) => item.id === id); onChange([...ordered, { ...structuredClone(original), id: crypto.randomUUID(), order: ordered.length }]); }} remove={(id) => onChange(ordered.filter((item) => item.id !== id).map((item, order) => ({ ...item, order })))} toggle={(id) => onChange(ordered.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))} />)}</div></SortableContext></DndContext>;
}
