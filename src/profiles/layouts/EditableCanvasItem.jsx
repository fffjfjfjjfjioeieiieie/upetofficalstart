import React from 'react';
import { Rnd } from 'react-rnd';

export default function EditableCanvasItem({ geometry, onChange, children, minWidth = 160, minHeight = 60, dragGrid = [8, 8], resizeGrid = [8, 8], showHandle = false }) {
  return <Rnd bounds="parent" dragGrid={dragGrid} resizeGrid={resizeGrid} minWidth={minWidth} minHeight={minHeight}
    {...(showHandle ? { enableResizing: { bottomRight: true }, resizeHandleStyles: { bottomRight: { width: 32, height: 32, right: -9, bottom: -9, borderRadius: 10, border: '2px solid #0c1524', background: '#70d7f3', boxShadow: '0 2px 12px #0008', touchAction: 'none' } } } : {})}
    size={{ width: geometry.w, height: geometry.h }} position={{ x: geometry.x, y: geometry.y }}
    onDragStop={(_, position) => onChange({ ...geometry, x: Math.max(0, Math.round(position.x)), y: Math.max(0, Math.round(position.y)) })}
    onResizeStop={(_, __, element, ___, position) => onChange({ x: Math.max(0, Math.round(position.x)), y: Math.max(0, Math.round(position.y)), w: Math.round(element.offsetWidth), h: Math.round(element.offsetHeight) })}>
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>{children}</div>
  </Rnd>;
}
