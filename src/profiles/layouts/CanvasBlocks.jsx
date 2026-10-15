import React from 'react';
import styles from './CanvasBlocks.module.css';
const EditableCanvasItem = React.lazy(() => import('./EditableCanvasItem.jsx'));

export function blockGeometry(block, index) {
  const raw = block.style || {};
  const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  return { x: Math.max(0, number(raw.x, index % 2 * 320)), y: Math.max(0, number(raw.y, Math.floor(index / 2) * 170)), w: Math.max(160, number(raw.w, 300)), h: Math.max(60, number(raw.h, 140)) };
}

export default function CanvasBlocks({ blocks, renderBlock, editable = false, onGeometryChange, mobilePreview = false }) {
  const arranged = blocks.map((block, index) => ({ block, geometry: blockGeometry(block, index) }));
  const height = arranged.length ? Math.max(230, ...arranged.map(({ geometry }) => geometry.y + geometry.h + 25)) : 230;
  return <div className={styles.root} data-mobile-preview={mobilePreview}><div className={styles.stage} style={{ minHeight: height }}>
    {arranged.map(({ block, geometry }) => editable && !mobilePreview
      ? <React.Suspense key={block.id} fallback={<div className={styles.item} style={{ left: geometry.x, top: geometry.y, width: geometry.w, height: geometry.h }}>{renderBlock(block)}</div>}><EditableCanvasItem geometry={geometry} onChange={(next) => onGeometryChange(block.id, next)}>{renderBlock(block)}</EditableCanvasItem></React.Suspense>
      : <div className={styles.item} key={block.id} style={{ left: geometry.x, top: geometry.y, width: geometry.w, height: geometry.h }}>{renderBlock(block)}</div>)}
  </div></div>;
}
