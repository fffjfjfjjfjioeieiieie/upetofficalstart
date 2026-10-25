import { z } from 'zod';
import { lyricsDocumentV2Schema } from '../../src/shared/contracts/profileV2.js';
import { createPublicRequestCache } from './publicRequestCache.js';
import { normalizePublicUsername, PublicProfileNotFoundError } from './publicProfileService.js';

const cache = createPublicRequestCache();
const idPattern = /^[A-Za-z0-9_-]{1,120}$/;

export const publicLyricsProjectionV2Schema = z.object({
  schemaVersion: z.literal(1),
  trackId: z.string().min(1).max(120),
  revision: z.number().int().nonnegative(),
  timingMode: z.enum(['none', 'line', 'word']),
  offsetMs: z.number().int(),
  language: z.string().max(32),
  stanzas: z.array(z.object({
    id: z.string().min(1).max(120),
    order: z.number().int().nonnegative(),
    label: z.string().max(80),
    lines: z.array(z.object({
      id: z.string().min(1).max(120),
      text: z.string().max(500),
      startMs: z.number().int().nonnegative().nullable(),
      endMs: z.number().int().nonnegative().nullable(),
      words: z.array(z.object({
        id: z.string().min(1).max(120),
        text: z.string().max(120),
        startMs: z.number().int().nonnegative(),
        endMs: z.number().int().nonnegative().nullable(),
      }).strict()).max(300),
    }).strict()).max(500),
  }).strict()).max(200),
  display: z.object({
    align: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.number().min(8).max(72).optional(),
    color: z.string().max(64).optional(),
    activeColor: z.string().max(64).optional(),
  }).strict(),
}).strict();

export function projectPublicLyricsV2(document) {
  const source = lyricsDocumentV2Schema.parse(document);
  return publicLyricsProjectionV2Schema.parse({
    schemaVersion: source.schemaVersion,
    trackId: source.trackId,
    revision: source.revision,
    timingMode: source.timingMode,
    offsetMs: source.offsetMs,
    language: source.language,
    stanzas: source.stanzas.map((stanza) => ({
      id: stanza.id,
      order: stanza.order,
      label: stanza.label,
      lines: stanza.lines.map((line) => ({
        id: line.id,
        text: line.text,
        startMs: line.startMs,
        endMs: line.endMs,
        words: line.words.map((word) => ({
          id: word.id,
          text: word.text,
          startMs: word.startMs,
          endMs: word.endMs,
        })),
      })),
    })),
    display: Object.fromEntries(['align', 'fontSize', 'color', 'activeColor']
      .filter((key) => source.display?.[key] !== undefined)
      .map((key) => [key, source.display[key]])),
  });
}

export async function loadPublicLyricsV2(db, username, trackId) {
  const normalized = normalizePublicUsername(username);
  const normalizedTrackId = String(trackId || '');
  if (!idPattern.test(normalizedTrackId)) throw new Error('Invalid track identifier.');
  return cache.get(`${normalized}:${normalizedTrackId}`, async () => {
    const profileSnapshot = await db.collection('profileV2Public').doc(normalized).get();
    if (!profileSnapshot.exists) throw new PublicProfileNotFoundError(normalized);
    const track = profileSnapshot.data()?.music?.tracks?.find((item) => item.id === normalizedTrackId);
    if (!track?.lyricsDocumentId || !idPattern.test(track.lyricsDocumentId)) {
      throw new PublicProfileNotFoundError(normalized);
    }
    const lyricsSnapshot = await db.collection('profileV2PublicLyrics').doc(`${normalized}_${normalizedTrackId}`).get();
    if (!lyricsSnapshot.exists) throw new PublicProfileNotFoundError(normalized);
    const publicLyrics = publicLyricsProjectionV2Schema.parse(lyricsSnapshot.data());
    if (publicLyrics.trackId !== normalizedTrackId) throw new PublicProfileNotFoundError(normalized);
    return publicLyrics;
  });
}

export function invalidatePublicLyricsV2(username) {
  const prefix = `${normalizePublicUsername(username)}:`;
  cache.invalidatePrefix(prefix);
}
