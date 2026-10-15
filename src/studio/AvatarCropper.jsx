import React, { useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';

export default function AvatarCropper({ file, onCancel, onSave }) {
  const editor = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: .5, y: .5 });
  const [working, setWorking] = useState(false);
  const save = () => {
    setWorking(true);
    editor.current?.getImageScaledToCanvas().toBlob((blob) => {
      if (!blob) { setWorking(false); return; }
      onSave(new File([blob], `avatar-${Date.now()}.png`, { type: 'image/png' }));
    }, 'image/png', .92);
  };
  return <div className="studio-dialog-backdrop"><section className="studio-dialog studio-crop-dialog" role="dialog" aria-modal="true" aria-label="Crop avatar"><header><h2>Crop avatar</h2><button type="button" onClick={onCancel}>Cancel</button></header><p>Move the image inside the frame, then adjust zoom and rotation.</p><div className="studio-crop-stage"><AvatarEditor ref={editor} image={file} width={240} height={240} border={24} borderRadius={120} scale={zoom} rotate={rotation} position={position} onPositionChange={setPosition} /></div><label className="studio-field"><span>Zoom {Math.round(zoom * 100)}%</span><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><label className="studio-field"><span>Rotation {rotation}°</span><input type="range" min="-180" max="180" step="1" value={rotation} onChange={(event) => setRotation(Number(event.target.value))} /></label><footer><button type="button" onClick={() => { setZoom(1); setRotation(0); setPosition({ x: .5, y: .5 }); }}>Reset</button><button className="studio-primary" type="button" onClick={save} disabled={working}>{working ? 'Preparing…' : 'Use this avatar'}</button></footer></section></div>;
}
