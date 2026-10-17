import { useRef } from "react";
import { toast } from "sonner";
import { Upload, Music, Trash2, Plus, Captions } from "lucide-react";
import { useStore, fileToDataUrl } from "../../../lib/store";
import { Panel, SliderRow, ToggleRow, Field, inputCls } from "../../../components/Controls";

export default function AudioTab() {
  const { user, setProfile } = useStore();
  const a = user.profile.audio;
  const set = (k) => (v) => setProfile(`audio.${k}`, v);
  const track = useRef(null);
  const cover = useRef(null);
  const lyrics = a.lyrics || { enabled: false, lines: [] };
  const updateLyrics = (next) => set("lyrics")({ ...lyrics, ...next });
  const addLyric = () => updateLyrics({ lines: [...lyrics.lines, { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, time: 0, text: "" }] });
  const updateLyric = (id, key, value) => updateLyrics({ lines: lyrics.lines.map((line) => line.id === id ? { ...line, [key]: key === "time" ? (Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0) : value } : line) });
  const removeLyric = (id) => updateLyrics({ lines: lyrics.lines.filter((line) => line.id !== id) });
  const onTrack = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return toast.error("Audio files can be up to 20 MB.");
    try {
      set("src")(await fileToDataUrl(f, 900, 'audio'));
      if (!a.title) set("title")(f.name.replace(/\.[^.]+$/, ""));
      toast.success("Audio uploaded");
    } catch (error) {
      toast.error(error?.message || 'Audio could not be uploaded');
    }
  };
  const onCover = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { set("cover")(await fileToDataUrl(f, 200, 'cover')); }
    catch (error) { toast.error(error?.message || 'Cover art could not be uploaded'); }
  };
  return (
    <>
      <Panel title="Track" desc="Plays on your page with a custom mini player." testid="audio-panel">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <button data-testid="audio-upload" onClick={() => track.current.click()} className="glass grid h-28 place-items-center rounded-2xl border-dashed transition-colors hover:bg-primary/10">
            <span className="flex flex-col items-center gap-2 text-xs"><Music className="h-5 w-5 text-primary" />{a.src ? "Replace audio" : "Upload audio"}</span>
          </button>
          <button data-testid="audio-cover-upload" onClick={() => cover.current.click()} className="glass relative grid h-28 place-items-center overflow-hidden rounded-2xl transition-colors hover:bg-primary/10">
            {a.cover ? <img src={a.cover} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2 text-xs"><Upload className="h-5 w-5 text-primary" />Cover art</span>}
          </button>
          {a.src && <button data-testid="audio-remove" onClick={() => set("src")("")} className="glass grid h-28 place-items-center rounded-2xl text-xs text-red-500 transition-colors hover:bg-red-500/10"><span className="flex flex-col items-center gap-2"><Trash2 className="h-5 w-5" />Remove</span></button>}
        </div>
        <input ref={track} type="file" accept="audio/*" hidden onChange={onTrack} />
        <input ref={cover} type="file" accept="image/*" hidden onChange={onCover} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Audio URL"><input data-testid="audio-url" className={inputCls} placeholder="https://…/song.mp3" defaultValue={a.src.startsWith("data:") ? "" : a.src} onBlur={(e) => e.target.value && set("src")(e.target.value)} /></Field>
          <Field label="Title"><input data-testid="audio-title" className={inputCls} value={a.title} onChange={(e) => set("title")(e.target.value)} /></Field>
          <Field label="Artist"><input data-testid="audio-artist" className={inputCls} value={a.artist} onChange={(e) => set("artist")(e.target.value)} /></Field>
        </div>
      </Panel>
      <Panel title="Playback" testid="audio-playback">
        <div className="grid gap-4 md:grid-cols-3">
          <SliderRow testid="audio-volume" label="Volume" value={a.volume} min={0} max={1} step={0.01} onChange={set("volume")} />
          <ToggleRow testid="audio-autoplay" label="Autoplay on enter" checked={a.autoplay} onChange={set("autoplay")} />
          <ToggleRow testid="audio-loop" label="Loop" checked={a.loop} onChange={set("loop")} />
        </div>
      </Panel>
      <Panel title="Lyrics" desc="Add timed lines. Visitors can tap the track title to open a synced lyrics view." testid="audio-lyrics">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ToggleRow testid="lyrics-enabled" label="Enable lyrics on profile" checked={lyrics.enabled} onChange={(enabled) => updateLyrics({ enabled })} />
          <button type="button" data-testid="lyrics-add-line" onClick={addLyric} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="h-3.5 w-3.5" />Add lyric</button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Use seconds from the beginning of the song, for example <span className="font-mono">83.5</span> for 1:23.5.</p>
        {!lyrics.lines.length && <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-white/15 p-4 text-xs text-muted-foreground"><Captions className="h-4 w-4 text-primary" />Add each line and the second it begins in the track.</div>}
        <div className="mt-4 space-y-2">
          {lyrics.lines.map((line, index) => <div key={line.id} className="grid grid-cols-[84px_minmax(0,1fr)_36px] gap-2">
            <input aria-label={`Lyric ${index + 1} timestamp`} data-testid={`lyric-time-${index}`} className={inputCls} type="number" min="0" step="0.01" defaultValue={line.time} onFocus={(event) => { if (event.currentTarget.value === "0") event.currentTarget.select(); }} onBlur={(event) => updateLyric(line.id, "time", event.target.value)} />
            <input aria-label={`Lyric ${index + 1} text`} data-testid={`lyric-text-${index}`} className={inputCls} placeholder="Lyric line" value={line.text} onChange={(event) => updateLyric(line.id, "text", event.target.value)} />
            <button type="button" data-testid={`lyric-remove-${index}`} onClick={() => removeLyric(line.id)} aria-label="Remove lyric" className="grid place-items-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>)}
        </div>
      </Panel>
    </>
  );
}
