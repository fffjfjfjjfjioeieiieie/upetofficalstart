export const AUDIO_EXTENSION_MIME = Object.freeze({
  mp3: 'audio/mpeg',
  mpeg: 'audio/mpeg',
  mpga: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  wav: 'audio/wav',
  wave: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg',
  webm: 'audio/webm',
  aac: 'audio/aac',
  flac: 'audio/flac',
});

export const AUDIO_MIME_TYPES = Object.freeze([
  'audio/mpeg',
  'audio/mp4',
  'video/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/vnd.wave',
  'audio/ogg',
  'application/ogg',
  'audio/opus',
  'audio/webm',
  'video/webm',
  'audio/aac',
  'audio/flac',
  'audio/x-flac',
]);

export const AUDIO_EXTENSIONS = Object.freeze(Object.keys(AUDIO_EXTENSION_MIME).map((extension) => `.${extension}`));

// Explicit extensions are needed because some mobile file pickers interpret
// `audio/*` as only the device's preferred recording format.
export const AUDIO_INPUT_ACCEPT = [...AUDIO_EXTENSIONS, ...AUDIO_MIME_TYPES].join(',');

export const AUDIO_DROPZONE_ACCEPT = Object.freeze({
  'audio/mpeg': ['.mp3', '.mpeg', '.mpga'],
  'audio/mp4': ['.m4a', '.mp4'],
  'audio/wav': ['.wav', '.wave'],
  'audio/ogg': ['.ogg', '.oga', '.opus'],
  'audio/webm': ['.webm'],
  'audio/aac': ['.aac'],
  'audio/flac': ['.flac'],
});
