import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Captions, ChevronDown, ChevronLeft, ChevronRight, Download, FileUp, GripVertical, Pause, Play, Plus, Redo2, RotateCcw, SkipBack, SkipForward, Trash2, Undo2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "../../../lib/store";
import { ChoiceChips, ColorRow, Field, inputCls, Panel, SliderRow, ToggleRow } from "../../../components/Controls";
import { activeLyricIndex, exportLyricsLrc, formatLyricTime as clock, latestStartedLyricIndex, lyricId as makeId, parseLyricText as parseLyrics, parseLyricTime as parseClock, withAutomaticLyricEnds } from "../../../lib/lyrics";

const cloneLines = (lines) => lines.map((line) => ({ ...line }));
const sameLines = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const TimeInput = ({ line, index, end = false, onCommit }) => {
  const raw = end ? line.endTime : line.synced ? line.time : null;
  const shown = raw === null || raw === undefined ? "" : clock(raw, true);
  const [value, setValue] = useState(shown);
  useEffect(() => setValue(shown), [shown]);
  const commit = () => {
    if (end && !value.trim()) return onCommit(null);
    const time = parseClock(value);
    if (time === null || (end && time <= Number(line.time || 0))) {
      setValue(shown);
      return toast.error(end ? "A lyric must end after it starts." : "Use seconds or a time like 1:23.45.");
    }
    onCommit(time);
  };
  return <input aria-label={`Lyric ${index + 1} ${end ? "end" : "start"} time`} className={`${inputCls} h-9 px-2 font-mono text-xs ${!end && !line.synced ? "text-muted-foreground" : ""}`} value={value} placeholder={end ? "Auto" : "Untimed"} onClick={(event) => event.stopPropagation()} onFocus={(event) => { if (!end && !line.synced) event.currentTarget.select(); }} onChange={(event) => setValue(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />;
};

const WaveformTimeline = ({ src, mediaRef, accent, duration, lines, active, onReady, onMarkerMove }) => {
  const waveform = useRef(null);
  const markerLayer = useRef(null);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    if (!src || !waveform.current || !mediaRef.current) return undefined;
    let activeInstance = true;
    let instance;
    import("wavesurfer.js").then(({ default: WaveSurfer }) => {
      if (!activeInstance) return;
      instance = WaveSurfer.create({
        container: waveform.current,
        media: mediaRef.current,
        url: src,
        height: 96,
        waveColor: "rgba(148,163,184,.34)",
        progressColor: accent,
        cursorColor: "#ffffff",
        cursorWidth: 2,
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        normalize: true,
        dragToSeek: true,
      });
      instance.on("ready", (length) => { setFailed(false); onReady(length); });
      instance.on("error", () => setFailed(true));
    }).catch(() => setFailed(true));
    return () => { activeInstance = false; instance?.destroy(); };
  }, [src, accent, mediaRef, onReady]);

  const beginDrag = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = markerLayer.current?.getBoundingClientRect();
    if (!rect || !duration) return;
    const timeAt = (clientX) => Math.max(0, Math.min(duration, ((clientX - rect.left) / rect.width) * duration));
    setDragging({ index, time: timeAt(event.clientX) });
    const move = (moveEvent) => { moveEvent.preventDefault(); setDragging({ index, time: timeAt(moveEvent.clientX) }); };
    const finish = (upEvent) => {
      const time = Math.round(timeAt(upEvent.clientX) * 100) / 100;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      setDragging(null);
      onMarkerMove(index, time);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", finish, { once: true });
  };

  return <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07111f] px-3 py-3 shadow-inner">
    <div ref={waveform} data-testid="lyrics-waveform" className="min-h-24" />
    <div ref={markerLayer} className="pointer-events-none absolute inset-x-3 top-3 h-24" aria-label="Draggable lyric timing markers">
      {lines.map((line, index) => {
        if (!line.synced || !duration) return null;
        const markerTime = dragging?.index === index ? dragging.time : Number(line.time || 0);
        const left = Math.max(0, Math.min(100, (markerTime / duration) * 100));
        return <button key={line.id} type="button" aria-label={`Move lyric ${index + 1} timing`} title={`${index + 1} · ${clock(markerTime, true)}`} onPointerDown={(event) => beginDrag(event, index)} className="pointer-events-auto absolute inset-y-0 z-10 w-3 -translate-x-1/2 touch-none cursor-ew-resize" style={{ left: `${left}%` }}><span className={`absolute left-1/2 top-0 h-full w-px -translate-x-1/2 ${index === active ? "bg-white" : "bg-primary/70"}`} /><span className={`absolute left-1/2 top-0 grid h-4 min-w-4 -translate-x-1/2 place-items-center rounded-full px-1 text-[8px] font-bold ${index === active ? "bg-white text-black" : "bg-primary text-primary-foreground"}`}>{index + 1}</span></button>;
      })}
    </div>
    {failed && <p className="mt-2 text-xs text-amber-300/80">Waveform preview could not be decoded, but playback and timestamp editing still work.</p>}
  </div>;
};

const PlacementPreview = ({ lyrics, accent }) => {
  const side = lyrics.display === "left" || lyrics.display === "right" ? lyrics.display : null;
  const verticalClass = lyrics.sideVertical === "top" ? "top-5" : lyrics.sideVertical === "bottom" ? "bottom-5" : "top-1/2 -translate-y-1/2";
  return <div className="relative mb-5 h-64 overflow-hidden rounded-xl border border-white/10 bg-[#0b1626] text-white shadow-inner">
    <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 45%, ${accent}55, transparent 42%)` }} />
    <div className="absolute left-1/2 top-1/2 h-44 w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/20 bg-black/55 p-3 shadow-2xl"><div className="mx-auto h-10 w-10 rounded-full bg-white/15" /><div className="mx-auto mt-3 h-2 w-16 rounded-full bg-white/25" /><div className="mx-auto mt-4 h-5 w-full rounded-md bg-white/10" /><div className="mx-auto mt-2 h-5 w-full rounded-md bg-white/10" /><p className="absolute inset-x-0 bottom-3 text-center text-[9px] uppercase tracking-[.2em] text-white/35">Profile</p></div>
    {side ? <div className={`absolute ${side === "left" ? "left-[4%] text-right" : "right-[4%] text-left"} ${verticalClass} w-[28%]`}><p className="mb-2 text-[9px] uppercase tracking-[.2em] text-white/35">Background {side}</p><p className="text-xs text-white/30">Previous line</p><p className="my-2 break-words font-display text-[clamp(18px,2.2vw,30px)] font-bold leading-none" style={{ color: lyrics.activeColor || "#fff", textShadow: lyrics.textEffect === "glow" ? `0 0 16px ${accent}` : undefined }}>Current lyric appears big here</p><p className="text-xs text-white/30">Next line</p></div> : <div className="absolute bottom-4 left-1/2 w-[36%] -translate-x-1/2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-center text-[10px] text-primary">Lyrics open inside the expanded player</div>}
    {side && <><div className={`absolute ${side === "left" ? "left-[2%]" : "right-[2%]"} top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground`}>Selected area</div><div className={`absolute ${side === "left" ? "left-[33%]" : "right-[33%]"} top-1/2 h-px w-[9%] bg-primary/70`} /></>}
  </div>;
};

export default function LyricsTab() {
  const { user, setProfile } = useStore();
  const audio = user.profile.audio;
  const lyrics = audio.lyrics || { enabled: false, lines: [] };
  const lines = lyrics.lines ?? [];
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const player = useRef(null);
  const lrcFile = useRef(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const lastEdit = useRef({ key: "", at: 0 });
  const [historyTick, setHistoryTick] = useState(0);
  const [paste, setPaste] = useState("");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [syncIndex, setSyncIndex] = useState(null);
  const [timingOpen, setTimingOpen] = useState(false);
  const [timingPage, setTimingPage] = useState(0);
  const stampRef = useRef(null);
  const pageSize = 8;

  const setLyrics = (next) => setProfile("audio.lyrics", { ...lyrics, ...next });
  const saveLines = (next, key = "edit") => {
    const current = linesRef.current;
    if (sameLines(current, next)) return;
    const now = Date.now();
    if (lastEdit.current.key !== key || now - lastEdit.current.at > 800) {
      undoStack.current.push(cloneLines(current));
      if (undoStack.current.length > 60) undoStack.current.shift();
    }
    lastEdit.current = { key, at: now };
    redoStack.current = [];
    linesRef.current = next;
    setLyrics({ lines: next });
    setHistoryTick((tick) => tick + 1);
  };
  const replaceWithoutHistory = (next) => {
    linesRef.current = next;
    setLyrics({ lines: next });
    setHistoryTick((tick) => tick + 1);
  };
  const undo = () => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(cloneLines(linesRef.current));
    lastEdit.current = { key: "", at: 0 };
    replaceWithoutHistory(previous);
  };
  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(cloneLines(linesRef.current));
    lastEdit.current = { key: "", at: 0 };
    replaceWithoutHistory(next);
  };
  const updateLine = (index, changes, key = `line:${index}`) => saveLines(linesRef.current.map((line, row) => row === index ? { ...line, ...changes } : line), key);
  const addLine = () => {
    setTimingOpen(true);
    setTimingPage(Math.floor(linesRef.current.length / pageSize));
    saveLines([...linesRef.current, { id: makeId(), time: 0, endTime: null, synced: false, text: "" }], "add-line");
  };
  const importText = (raw, mode = "replace") => {
    const parsed = withAutomaticLyricEnds(parseLyrics(raw));
    if (!parsed.length) return toast.error("Add at least one lyric line first.");
    saveLines(mode === "replace" ? parsed : [...linesRef.current, ...parsed], `import:${Date.now()}`);
    setTimingOpen(true);
    setTimingPage(0);
    setPaste("");
    setSyncIndex(null);
    const timed = parsed.filter((line) => line.synced).length;
    toast.success(timed ? `${parsed.length} lines imported with ${timed} timestamps.` : `${parsed.length} editable lines added.`);
  };
  const importLrcFile = async (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > 1024 * 1024) return toast.error("LRC files must be smaller than 1 MB.");
    try { importText(await file.text(), "replace"); }
    catch { toast.error("That LRC file could not be read."); }
  };
  const exportLrc = () => {
    const contents = exportLyricsLrc(linesRef.current);
    if (!contents) return toast.error("Add lyrics before exporting.");
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(audio.title || "lyrics").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "lyrics"}.lrc`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const toggle = () => {
    if (!player.current) return;
    if (player.current.paused) player.current.play().catch(() => setPlaying(false));
    else player.current.pause();
  };
  const changedStart = (index, time, key = `start:${index}`) => {
    const current = linesRef.current;
    const oldTime = Number(current[index]?.time || 0);
    let previousIndex = index - 1;
    while (previousIndex >= 0 && !current[previousIndex].synced) previousIndex -= 1;
    const previousTime = previousIndex >= 0 ? Number(current[previousIndex].time) + 0.01 : 0;
    const nextTime = current.slice(index + 1).find((line) => line.synced)?.time;
    const bounded = Math.round(Math.max(previousTime, Math.min(nextTime === undefined ? (duration || 86400) : Number(nextTime) - 0.01, Number(time) || 0)) * 100) / 100;
    const next = cloneLines(current);
    next[index] = { ...next[index], time: bounded, synced: true, endTime: next[index].endTime !== null && Number(next[index].endTime) <= bounded ? null : next[index].endTime };
    if (previousIndex >= 0 && (next[previousIndex].endTime === null || Math.abs(Number(next[previousIndex].endTime) - oldTime) < 0.03)) next[previousIndex].endTime = bounded;
    const following = next.slice(index + 1).find((line) => line.synced && Number(line.time) > bounded);
    if (next[index].endTime === null && following) next[index].endTime = Number(following.time);
    saveLines(next, key);
  };
  const stamp = (index = syncIndex) => {
    if (index === null || !linesRef.current[index]) return;
    changedStart(index, player.current?.currentTime || 0, `stamp:${linesRef.current[index].id}`);
    const nextIndex = index + 1 < linesRef.current.length ? index + 1 : null;
    setSyncIndex(nextIndex);
    if (nextIndex !== null) setTimingPage(Math.floor(nextIndex / pageSize));
  };
  stampRef.current = stamp;
  const beginSync = () => {
    if (!audio.src) return toast.error("Upload audio you have permission to use before syncing lyrics.");
    if (!linesRef.current.length) return toast.error("Add lyric lines first.");
    const firstUntimed = linesRef.current.findIndex((line) => !line.synced);
    const first = firstUntimed >= 0 ? firstUntimed : 0;
    setSyncIndex(first);
    setTimingPage(Math.floor(first / pageSize));
    player.current?.play().catch(() => {});
  };
  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= linesRef.current.length) return;
    const next = cloneLines(linesRef.current);
    [next[index], next[target]] = [next[target], next[index]];
    saveLines(next, `move:${next[target].id}`);
    if (syncIndex === index) setSyncIndex(target);
    else if (syncIndex === target) setSyncIndex(index);
  };
  const removeLine = (index) => {
    saveLines(linesRef.current.filter((_, row) => row !== index), `remove:${linesRef.current[index]?.id}`);
    if (syncIndex === index) setSyncIndex(null);
    else if (syncIndex !== null && syncIndex > index) setSyncIndex(syncIndex - 1);
  };
  const nudge = (index, amount) => changedStart(index, Number(linesRef.current[index].time || 0) + amount, `nudge:${linesRef.current[index].id}:${Date.now()}`);

  useEffect(() => { if (player.current) player.current.volume = audio.volume ?? 0.6; }, [audio.volume]);
  useEffect(() => {
    if (syncIndex === null) return undefined;
    const press = (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (event.code !== "Space" || ["input", "textarea", "select", "button", "a"].includes(tag) || event.target?.isContentEditable) return;
      event.preventDefault();
      stampRef.current?.();
    };
    window.addEventListener("keydown", press);
    return () => window.removeEventListener("keydown", press);
  }, [syncIndex]);

  const syncedCount = lines.filter((line) => line.synced).length;
  const syncProgress = lines.length ? Math.round((syncedCount / lines.length) * 100) : 0;
  const active = activeLyricIndex(lines, currentTime);
  const latest = latestStartedLyricIndex(lines, currentTime);
  const focus = active >= 0 ? active : latest;
  const parsedPreview = useMemo(() => parseLyrics(paste, (_, index) => `preview-${index}`).length, [paste]);
  const lastTimingPage = Math.max(0, Math.ceil(lines.length / pageSize) - 1);
  const visibleTimingPage = Math.min(timingPage, lastTimingPage);
  const timingStart = visibleTimingPage * pageSize;
  const visibleTimingLines = lines.slice(timingStart, timingStart + pageSize);
  void historyTick;

  const row = (line, index, mobile = false) => <div key={line.id} onClick={() => setSyncIndex(index)} className={`${mobile ? "rounded-2xl p-3" : "grid grid-cols-[24px_34px_88px_88px_minmax(150px,1fr)_auto] gap-2 rounded-xl p-2"} cursor-pointer border transition-all ${syncIndex === index ? "border-primary bg-primary/10 ring-2 ring-primary/20" : active === index ? "border-primary/50 bg-primary/[.07]" : "border-white/10 bg-background/40 hover:bg-primary/[.04]"}`}>
    {mobile ? <>
      <div className="mb-2 flex items-center gap-2"><GripVertical className="h-4 w-4 text-white/25" /><span className={`grid h-7 w-7 place-items-center rounded-lg font-mono text-[11px] ${line.synced ? "bg-primary/15 text-primary" : "bg-white/5 text-muted-foreground"}`}>{index + 1}</span><span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{line.synced ? `${clock(line.time, true)} → ${line.endTime == null ? "auto" : clock(line.endTime, true)}` : "Waiting to sync"}</span><button type="button" onClick={(event) => { event.stopPropagation(); removeLine(index); }} aria-label="Delete lyric line" className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></div>
      <input aria-label={`Lyric ${index + 1} text`} className={`${inputCls} h-10`} placeholder="Lyric line" value={line.text} onClick={(event) => event.stopPropagation()} onChange={(event) => updateLine(index, { text: event.target.value }, `text:${line.id}`)} />
      <div className="mt-2 grid grid-cols-2 gap-2"><TimeInput line={line} index={index} onCommit={(time) => changedStart(index, time)} /><TimeInput line={line} index={index} end onCommit={(endTime) => updateLine(index, { endTime }, `end:${line.id}`)} /></div>
      <div className="mt-2 flex items-center justify-between gap-2"><div className="flex gap-1"><button type="button" onClick={(event) => { event.stopPropagation(); nudge(index, -.1); }} className="rounded-lg bg-white/5 px-2.5 py-2 font-mono text-[11px]">−.1</button><button type="button" onClick={(event) => { event.stopPropagation(); nudge(index, .1); }} className="rounded-lg bg-white/5 px-2.5 py-2 font-mono text-[11px]">+.1</button></div><button type="button" onClick={(event) => { event.stopPropagation(); stamp(index); }} className="rounded-lg bg-primary/15 px-3 py-2 text-xs font-semibold text-primary">Set to playhead</button></div>
    </> : <>
      <GripVertical className="mt-2.5 h-4 w-4 text-white/25" /><span className={`grid h-9 place-items-center rounded-lg font-mono text-xs ${line.synced ? "bg-primary/15 text-primary" : "bg-background/60 text-muted-foreground"}`}>{index + 1}</span>
      <TimeInput line={line} index={index} onCommit={(time) => changedStart(index, time)} /><TimeInput line={line} index={index} end onCommit={(endTime) => updateLine(index, { endTime }, `end:${line.id}`)} />
      <input aria-label={`Lyric ${index + 1} text`} className={`${inputCls} h-9`} placeholder="Lyric line" value={line.text} onClick={(event) => event.stopPropagation()} onChange={(event) => updateLine(index, { text: event.target.value }, `text:${line.id}`)} />
      <div className="flex justify-end gap-1"><button type="button" title="Move 0.1 seconds earlier" onClick={(event) => { event.stopPropagation(); nudge(index, -.1); }} className="rounded-lg bg-white/5 px-2 font-mono text-[10px]">−.1</button><button type="button" title="Move 0.1 seconds later" onClick={(event) => { event.stopPropagation(); nudge(index, .1); }} className="rounded-lg bg-white/5 px-2 font-mono text-[10px]">+.1</button><button type="button" onClick={(event) => { event.stopPropagation(); stamp(index); }} className="rounded-lg bg-primary/10 px-2.5 text-[11px] font-semibold text-primary">Now</button><button type="button" onClick={(event) => { event.stopPropagation(); move(index, -1); }} disabled={index === 0} aria-label="Move line up" className="grid h-9 w-8 place-items-center rounded-lg bg-primary/10 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={(event) => { event.stopPropagation(); move(index, 1); }} disabled={index === lines.length - 1} aria-label="Move line down" className="grid h-9 w-8 place-items-center rounded-lg bg-primary/10 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button><button type="button" onClick={(event) => { event.stopPropagation(); removeLine(index); }} aria-label="Delete lyric line" className="grid h-9 w-8 place-items-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="h-3.5 w-3.5" /></button></div>
    </>}
  </div>;

  return <>
    <Panel title="Add lyrics" desc="Paste plain lyrics or import an LRC file. Every line stays editable." testid="lyrics-setup" defaultOpen>
      <div className="mb-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-[#17131f] to-[#0c0a12] p-4 text-white shadow-inner"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary"><WandSparkles className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{lines.length ? `${lines.length} lyric lines ready` : "Build your lyric timeline"}</p><p className="text-xs text-white/45">{syncedCount} synced · {lines.length - syncedCount} untimed</p></div><span className="rounded-full bg-white/[.06] px-3 py-1 font-mono text-xs text-white/65">{syncProgress}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-slate-400 transition-all duration-300" style={{ width: `${syncProgress}%` }} /></div></div>
      <ToggleRow testid="lyrics-enabled" label="Show lyrics on profile" checked={Boolean(lyrics.enabled)} onChange={(enabled) => setLyrics({ enabled })} />
      <Field label="Paste lyrics — one line per row">
        <div className="relative mt-3"><textarea data-testid="lyrics-paste" className={`${inputCls} min-h-44 resize-y border-white/10 bg-[#07111f] pb-9 font-mono leading-relaxed`} placeholder={'Paste the full song here…\nEach row becomes an editable lyric\n\nLRC timestamps are detected automatically'} value={paste} onChange={(event) => setPaste(event.target.value)} /><span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/[.06] px-2 py-1 text-[10px] text-muted-foreground">{paste.trim() ? `${parsedPreview} lines detected` : "Plain text or LRC"}</span></div>
      </Field>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" data-testid="lyrics-import-replace" disabled={!paste.trim()} onClick={() => importText(paste, "replace")} className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-40">Create lyric lines</button><button type="button" data-testid="lyrics-import-append" disabled={!paste.trim()} onClick={() => importText(paste, "append")} className="rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold hover:bg-primary/20 disabled:opacity-40">Add below existing</button><button type="button" onClick={() => lrcFile.current?.click()} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/5"><FileUp className="h-3.5 w-3.5" />Import LRC</button><button type="button" onClick={exportLrc} disabled={!lines.length} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/5 disabled:opacity-40"><Download className="h-3.5 w-3.5" />Export LRC</button><button type="button" onClick={addLine} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold hover:bg-primary/20"><Plus className="h-3.5 w-3.5" />Blank line</button><input ref={lrcFile} type="file" accept=".lrc,text/plain" hidden onChange={importLrcFile} /></div>
    </Panel>

    <Panel title="Sync lyrics" desc="Play the song, then tap each line into time. Drag markers for precise corrections." testid="lyrics-sync" defaultOpen>
      {!audio.src ? <div className="flex items-center gap-3 rounded-2xl bg-[#0b1626] p-5 text-sm text-white/55"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary"><Play className="h-4 w-4" /></span>Upload your own audio in the Audio tab before syncing. Existing lyrics are safe.</div> : <>
        <audio ref={player} src={audio.src} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={() => setDuration(player.current?.duration || 0)} onDurationChange={() => setDuration(player.current?.duration || 0)} onTimeUpdate={() => setCurrentTime(player.current?.currentTime || 0)} />
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1626] text-white shadow-inner">
          <div className="flex items-center gap-3 border-b border-white/[.07] p-4">{audio.cover ? <img src={audio.cover} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary"><Captions className="h-5 w-5" /></span>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{audio.title || "Untitled track"}</p><p className="truncate text-xs text-white/40">{audio.artist || "Lyric sync studio"}</p></div><span className="font-mono text-xs text-white/55">{clock(currentTime, true)} <span className="text-white/25">/ {clock(duration)}</span></span></div>
          <div className="space-y-4 p-4">
            <WaveformTimeline src={audio.src} mediaRef={player} accent={user.profile.card.accent} duration={duration} lines={lines} active={active} onReady={setDuration} onMarkerMove={(index, time) => changedStart(index, time, `marker:${linesRef.current[index]?.id}:${Date.now()}`)} />
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
              <div className="flex items-center justify-center gap-2"><button type="button" onClick={() => { if (player.current) player.current.currentTime = Math.max(0, currentTime - 5); }} aria-label="Back 5 seconds" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/75 hover:bg-white/15"><SkipBack className="h-4 w-4" /></button><button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/.28)]">{playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}</button><button type="button" onClick={() => { if (player.current) player.current.currentTime = Math.min(duration, currentTime + 5); }} aria-label="Forward 5 seconds" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/75 hover:bg-white/15"><SkipForward className="h-4 w-4" /></button></div>
              <div className="min-w-0 rounded-xl bg-white/[.045] px-4 py-3 text-center"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/30">Live lyrics</p><p className={`mt-1 truncate text-base font-bold transition-all ${active >= 0 ? "text-white" : "text-white/35"}`}>{focus >= 0 ? lines[focus]?.text : "Lyrics begin when the first timestamp starts"}</p>{focus >= 0 && lines[focus + 1] && <p className="mt-1 truncate text-xs text-white/25">{lines[focus + 1].text}</p>}</div>
              <button type="button" onClick={beginSync} disabled={!lines.length} className="rounded-xl bg-white/10 px-4 py-3 text-xs font-semibold hover:bg-white/15 disabled:opacity-40">{syncIndex === null ? "Start tap sync" : "Restart untimed"}</button>
            </div>
            <div className="hidden items-stretch gap-3 md:grid md:grid-cols-[1fr_auto]"><div className="rounded-xl border border-primary/15 bg-primary/[.06] px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Tap-to-sync active line</p><p className="mt-1 truncate text-sm font-semibold">{syncIndex !== null && lines[syncIndex] ? lines[syncIndex].text || "Blank line" : "Choose Start tap sync or select a row"}</p><p className="mt-1 text-[11px] text-white/35">Press <kbd className="rounded border border-white/15 bg-black/30 px-1.5 py-0.5 font-mono text-white/70">Space</kbd> when the line begins</p></div><button type="button" data-testid="lyrics-stamp" onClick={() => stamp()} disabled={syncIndex === null} className="min-w-44 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_10px_30px_-18px_hsl(var(--primary))] disabled:opacity-40">Stamp line {syncIndex === null ? "—" : syncIndex + 1}</button></div>
            <div className="md:hidden"><p className="mb-2 truncate text-center text-sm text-white/55">{syncIndex !== null && lines[syncIndex] ? lines[syncIndex].text || "Blank line" : "Start sync or select a lyric below"}</p><button type="button" data-testid="lyrics-stamp-mobile" onClick={() => stamp()} disabled={syncIndex === null} className="flex min-h-20 w-full touch-manipulation items-center justify-center rounded-2xl bg-primary px-5 text-lg font-black text-primary-foreground shadow-[0_14px_36px_-16px_hsl(var(--primary))] active:scale-[.98] disabled:opacity-40">Tap to Sync · {clock(currentTime, true)}</button></div>
          </div>
        </div>
      </>}

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1626]/55 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" data-testid="lyrics-timing-toggle" aria-expanded={timingOpen} aria-controls="lyrics-timing-lines" onClick={() => setTimingOpen((open) => !open)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Captions className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Timing table <span className="ml-1 font-mono text-xs text-muted-foreground">{lines.length} lines</span></span><span className="mt-0.5 block text-[11px] text-muted-foreground">{timingOpen ? "Edit timestamps and text below" : "Open to edit lines and timestamps"}</span></span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${timingOpen ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-1"><button type="button" onClick={undo} disabled={!undoStack.current.length} aria-label="Undo lyric edit" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-foreground disabled:opacity-30"><Undo2 className="h-4 w-4" /></button><button type="button" onClick={redo} disabled={!redoStack.current.length} aria-label="Redo lyric edit" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-foreground disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>{syncedCount > 0 && <button type="button" onClick={() => { saveLines(linesRef.current.map((line) => ({ ...line, time: 0, endTime: null, synced: false })), `clear:${Date.now()}`); setSyncIndex(null); }} className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" />Clear timing</button>}</div>
        </div>
        {timingOpen && <div id="lyrics-timing-lines" className="mt-3 border-t border-white/10 pt-3">
          <p className="mb-3 text-[11px] text-muted-foreground">End times fill from the next synced line. Enter one manually to create a pause.</p>
          {lines.length > pageSize && <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[.04] px-3 py-2"><span className="text-xs text-muted-foreground">Showing {timingStart + 1}–{Math.min(timingStart + pageSize, lines.length)} of {lines.length}</span><div className="flex items-center gap-1"><button type="button" aria-label="Previous lyric lines" disabled={visibleTimingPage === 0} onClick={() => setTimingPage(visibleTimingPage - 1)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><select aria-label="Lyric lines page" data-testid="lyrics-timing-page" value={visibleTimingPage} onChange={(event) => setTimingPage(Number(event.target.value))} className="h-8 rounded-lg border border-white/10 bg-[#0b1626] px-2 text-xs">{Array.from({ length: lastTimingPage + 1 }, (_, page) => <option key={page} value={page}>Lines {page * pageSize + 1}–{Math.min((page + 1) * pageSize, lines.length)}</option>)}</select><button type="button" aria-label="Next lyric lines" disabled={visibleTimingPage === lastTimingPage} onClick={() => setTimingPage(visibleTimingPage + 1)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>}
          {!!lines.length && <div className="hidden grid-cols-[24px_34px_88px_88px_minmax(150px,1fr)_auto] gap-2 px-2 text-[9px] font-semibold uppercase tracking-[.15em] text-muted-foreground md:grid"><span /><span>#</span><span>Starts</span><span>Ends</span><span>Lyric</span><span>Quick edit</span></div>}
          <div className="mt-2 hidden space-y-2 md:block">{visibleTimingLines.map((line, index) => row(line, timingStart + index, false))}</div>
          <div className="mt-2 space-y-2 md:hidden">{visibleTimingLines.map((line, index) => row(line, timingStart + index, true))}</div>
          {!lines.length && <div className="flex items-center gap-3 rounded-xl bg-[#0b1626] p-5 text-sm text-white/55"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><Captions className="h-4 w-4" /></span>Paste lyrics above to create editable lines.</div>}
        </div>}
      </div>
    </Panel>
    <Panel title="Lyrics appearance" desc="Place lyrics in the large background space beside the profile, or keep them inside the expanded player." testid="lyrics-appearance">
      <PlacementPreview lyrics={lyrics} accent={user.profile.card.accent} />
      {(lyrics.display === "left" || lyrics.display === "right") && <div className="mb-5 mt-3 rounded-xl border border-primary/20 bg-primary/[.06] px-4 py-3 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Placement help:</strong> side lyrics live on the desktop background and never inside the profile card. On mobile there is no safe outside space, so the expanded player is forced on for these lyrics even when its desktop toggle is off. Use <strong className="text-primary">Expand</strong> above the live preview to check the desktop position.</div>}
      <div className="space-y-5">
        <div><p className="mb-2 text-xs text-muted-foreground">Placement</p><ChoiceChips testid="lyrics-display" value={lyrics.display || "player"} options={[["player", "Expanded player"], ["left", "Background left"], ["right", "Background right"]]} onChange={(display) => setLyrics({ display })} /></div>
        {(lyrics.display === "left" || lyrics.display === "right") && <div className="rounded-2xl border border-primary/15 bg-primary/[.035] p-4"><div className="grid gap-5 md:grid-cols-2"><div><p className="mb-2 text-xs text-muted-foreground">Vertical position</p><ChoiceChips testid="lyrics-side-vertical" value={lyrics.sideVertical || "center"} options={[["top", "Upper"], ["center", "Middle"], ["bottom", "Lower"]]} onChange={(sideVertical) => setLyrics({ sideVertical })} /></div><SliderRow testid="lyrics-side-size" label="Big lyric size" value={lyrics.sideTextSize || 56} min={32} max={96} unit="px" onChange={(sideTextSize) => setLyrics({ sideTextSize })} /><SliderRow testid="lyrics-side-width" label="Text area width" value={lyrics.sideWidth || 420} min={260} max={560} unit="px" onChange={(sideWidth) => setLyrics({ sideWidth })} /><SliderRow testid="lyrics-side-inset" label="Distance from screen edge" value={lyrics.sideInset ?? 4} min={2} max={12} unit="vw" onChange={(sideInset) => setLyrics({ sideInset })} /></div></div>}
        <div><p className="mb-2 text-xs text-muted-foreground">Text effect</p><ChoiceChips testid="lyrics-text-effect" value={lyrics.textEffect || "none"} options={[["none", "None"], ["glow", "Soft glow"], ["fade", "Focus fade"], ["gradient", "Gradient"]]} onChange={(textEffect) => setLyrics({ textEffect })} /></div>
        {(lyrics.display === "left" || lyrics.display === "right") && <ToggleRow testid="lyrics-popout" label="Pop in each lyric when its timestamp starts" checked={lyrics.popout !== false} onChange={(popout) => setLyrics({ popout })} />}
        <div><p className="mb-2 text-xs text-muted-foreground">Alignment</p><ChoiceChips testid="lyrics-alignment" value={lyrics.alignment || "center"} options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} onChange={(alignment) => setLyrics({ alignment })} /></div>
        {lyrics.display === "player" && <SliderRow testid="lyrics-text-size" label="Player lyric size" value={lyrics.textSize || 42} min={18} max={72} unit="px" onChange={(textSize) => setLyrics({ textSize })} />}
        <div className="grid gap-3 md:grid-cols-2"><ColorRow testid="lyrics-text-color" label="Inactive line" value={lyrics.textColor || "#b8c0cc"} onChange={(textColor) => setLyrics({ textColor })} /><ColorRow testid="lyrics-active-color" label="Current line" value={lyrics.activeColor || "#ffffff"} onChange={(activeColor) => setLyrics({ activeColor })} /></div>
      </div>
    </Panel>
  </>;
}
