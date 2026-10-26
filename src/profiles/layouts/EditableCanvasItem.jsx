import React from 'react';
import { Rnd } from 'react-rnd';

export default function EditableCanvasItem({ geometry, onChange, children }) {
  return <Rnd bounds="parent" dragGrid={[8, 8]} resizeGrid={[8, 8]} minWidth={160} minHeight={60}
    size={{ width: geometry.w, height: geometry.h }} position={{ x: geometry.x, y: geometry.y }}
    onDragStop={(_, position) => onChange({ ...geometry, x: Math.max(0, Math.round(position.x)), y: Math.max(0, Math.round(position.y)) })}
    onResizeStop={(_, __, element, ___, position) => onChange({ x: Math.max(0, Math.round(position.x)), y: Math.max(0, Math.round(position.y)), w: Math.round(element.offsetWidth), h: Math.round(element.offsetHeight) })}>
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>{children}</div>
  </Rnd>;
}
