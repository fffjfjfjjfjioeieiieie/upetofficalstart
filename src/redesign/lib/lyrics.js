export const lyricId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export const formatLyricTime = (seconds, precise = false) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const fraction = precise ? `.${String(Math.floor((safe % 1) * 100)).padStart(2, '0')}` : '';
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}${fraction}`;
};

export const parseLyricTime = (value) => {
  const raw = String(value || '').trim();
  if (/^\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
  const match = raw.match(/^(\d+):([0-5]?\d(?:\.\d+)?)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export const latestStartedLyricIndex = (lines, currentTime) => (lines || []).reduce((found, line, index) => line.synced !== false && Number(line.time) <= currentTime && (found < 0 || Number(line.time) >= Number(lines[found].time)) ? index : found, -1);

export const activeLyricIndex = (lines, currentTime) => {
  const index = latestStartedLyricIndex(lines, currentTime);
  if (index < 0) return -1;
  const end = lines[index].endTime;
  return end !== null && end !== undefined && Number.isFinite(Number(end)) && currentTime >= Number(end) ? -1 : index;
};

export const nextLyricIndex = (lines, currentTime) => (lines || []).findIndex((line) => line.synced !== false && Number(line.time) > currentTime);

export const waitingForLyric = (lines, currentTime) => activeLyricIndex(lines, currentTime) < 0 && nextLyricIndex(lines, currentTime) >= 0;

export const parseLyricText = (value, createId = lyricId) => String(value || '').split(/\r?\n/).flatMap((raw) => {
  const text = raw.replace(/^(?:\[(?:\d{1,3}:\d{2}(?:[.:]\d{1,3})?)\])+\s*/, '').trim();
  if (!text || /^\[(ar|al|ti|by|offset):/i.test(raw.trim())) return [];
  const stamps = [...raw.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
  if (!stamps.length) return [{ id: createId(), time: 0, synced: false, text }];
  return stamps.map((stamp) => ({
    id: createId(),
    time: Number(stamp[1]) * 60 + Number(stamp[2]) + (stamp[3] ? Number(`0.${stamp[3]}`) : 0),
    synced: true,
    text,
  }));
});

export const withAutomaticLyricEnds = (lines = []) => lines.map((line, index) => {
  if (!line.synced || (line.endTime !== null && line.endTime !== undefined)) return { ...line };
  const next = lines.slice(index + 1).find((candidate) => candidate.synced && Number(candidate.time) > Number(line.time));
  return { ...line, endTime: next ? Number(next.time) : null };
});

export const exportLyricsLrc = (lines = []) => lines.map((line) => {
  const text = String(line.text || '').replace(/[\r\n]+/g, ' ').trim();
  return line.synced ? `[${formatLyricTime(line.time, true)}]${text}` : text;
}).filter(Boolean).join('\n');
