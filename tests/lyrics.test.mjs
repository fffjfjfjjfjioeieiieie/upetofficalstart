import test from 'node:test';
import assert from 'node:assert/strict';
import { activeLyricIndex, exportLyricsLrc, formatLyricTime, latestStartedLyricIndex, parseLyricText, parseLyricTime, waitingForLyric, withAutomaticLyricEnds } from '../src/redesign/lib/lyrics.js';

test('plain pasted lyrics remain untimed until the user syncs them', () => {
  let id = 0;
  const lines = parseLyricText('First line\n\nSecond line', () => `line-${++id}`);
  assert.deepEqual(lines, [
    { id: 'line-1', time: 0, synced: false, text: 'First line' },
    { id: 'line-2', time: 0, synced: false, text: 'Second line' },
  ]);
});

test('LRC paste preserves the real timestamp for each lyric line', () => {
  let id = 0;
  const lines = parseLyricText('[ar:Artist]\n[00:18.30]First line\n[01:02.05]Second line', () => `line-${++id}`);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].time, 18.3);
  assert.equal(lines[1].time, 62.05);
  assert.equal(lines.every((line) => line.synced), true);
});

test('manual lyric times accept seconds and minute clocks', () => {
  assert.equal(parseLyricTime('83.5'), 83.5);
  assert.equal(parseLyricTime('1:23.50'), 83.5);
  assert.equal(parseLyricTime('1:72'), null);
  assert.equal(formatLyricTime(83.5, true), '1:23.50');
});

test('lyrics stay hidden before their start and become inactive after an optional end', () => {
  const lines = [
    { id: 'one', time: 10, endTime: 14, synced: true, text: 'One' },
    { id: 'two', time: 20, endTime: null, synced: true, text: 'Two' },
  ];
  assert.equal(latestStartedLyricIndex(lines, 9.99), -1);
  assert.equal(activeLyricIndex(lines, 9.99), -1);
  assert.equal(activeLyricIndex(lines, 10), 0);
  assert.equal(activeLyricIndex(lines, 13.99), 0);
  assert.equal(activeLyricIndex(lines, 14), -1);
  assert.equal(latestStartedLyricIndex(lines, 18), 0);
  assert.equal(activeLyricIndex(lines, 20), 1);
});

test('automatic lyric ends use the next timestamp without replacing manual pauses', () => {
  const lines = withAutomaticLyricEnds([
    { id: 'one', time: 4, endTime: null, synced: true, text: 'One' },
    { id: 'two', time: 8, endTime: 10, synced: true, text: 'Two' },
    { id: 'three', time: 14, endTime: null, synced: true, text: 'Three' },
  ]);
  assert.equal(lines[0].endTime, 8);
  assert.equal(lines[1].endTime, 10);
  assert.equal(lines[2].endTime, null);
});

test('waiting indicator appears before the first line and during a timed gap only', () => {
  const lines = [
    { id: 'one', time: 10, endTime: 14, synced: true, text: 'One' },
    { id: 'two', time: 20, endTime: 25, synced: true, text: 'Two' },
  ];
  assert.equal(waitingForLyric(lines, 0), true);
  assert.equal(waitingForLyric(lines, 10), false);
  assert.equal(waitingForLyric(lines, 14), true);
  assert.equal(waitingForLyric(lines, 20), false);
  assert.equal(waitingForLyric(lines, 25), false);
});

test('LRC export preserves synced timestamps and untimed text', () => {
  assert.equal(exportLyricsLrc([
    { time: 3.25, synced: true, text: 'First' },
    { time: 0, synced: false, text: 'Waiting' },
  ]), '[0:03.25]First\nWaiting');
});
