import React from 'react';
import { useDropzone } from 'react-dropzone';

export default function MediaDropzone({ label, hint, accept, onFile, progress }) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept,
    multiple: false,
    maxFiles: 1,
    onDropAccepted: ([file]) => { if (file) onFile(file); },
  });

  return (
    <div {...getRootProps({ className: 'studio-dropzone', 'data-active': isDragActive })}>
      <input {...getInputProps()} />
      <strong>{isDragActive ? `Drop ${label.toLowerCase()} here` : label}</strong>
      <span>{hint || 'Drag a file here, or choose one from your device.'}</span>
      {progress ? <small>Uploading {progress}%</small> : null}
      {fileRejections.length > 0 ? <small role="alert">That file type is not supported here.</small> : null}
    </div>
  );
}
