import { useRef } from "react";
import { toast } from "sonner";
import { Upload, Music, Trash2 } from "lucide-react";
import { useStore, fileToDataUrl } from "../../../lib/store";
import { Panel, SliderRow, ToggleRow, Field, inputCls } from "../../../components/Controls";

export default function AudioTab() {
  const { user, setProfile } = useStore();
  const a = user.profile.audio;
  const set = (k) => (v) => setProfile(`audio.${k}`, v);
  const track = useRef(null);
  const cover = useRef(null);
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
    </>
  );
}
