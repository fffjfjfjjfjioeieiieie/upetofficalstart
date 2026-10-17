import { useRef } from "react";
import { toast } from "sonner";
import { Upload, Trash2, SlidersHorizontal, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { useStore, fileToDataUrl } from "../../../lib/store";
import { Panel, SliderRow, inputCls } from "../../../components/Controls";
import { mediaStyle } from "../../../components/ProfileBits";

const SLOTS = [["avatar", "Avatar", 400, "rounded-full"], ["banner", "Banner", 1200, "rounded-xl"], ["background", "Background", 1600, "rounded-xl"], ["cursor", "Cursor", 64, "rounded-xl"]];
const DEFAULTS = { zoom: 1, blur: 0, rotate: 0, size: 100, x: 50, y: 50 };

const MediaBox = ({ slot, label, max, shape }) => {
  const { user, setProfile } = useStore();
  const m = user.profile.media[slot];
  const file = useRef(null);
  const set = (k) => (v) => setProfile(`media.${slot}.${k}`, v);
  const onFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    try {
      set("src")(await fileToDataUrl(f, max, slot));
      toast.success(`${label} uploaded`);
    } catch (error) {
      toast.error(error?.message || `${label} could not be uploaded`);
    }
  };
  return (
    <div data-testid={`media-box-${slot}`} className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold">{label}<span className="font-mono text-[10px] text-muted-foreground">{m.src ? "set" : "empty"}</span></div>
      <button data-testid={`media-upload-${slot}`} onClick={() => file.current.click()} className={`group relative grid h-24 w-full place-items-center overflow-hidden border border-dashed border-primary/40 bg-primary/5 transition-colors hover:bg-primary/10 ${shape === "rounded-full" ? "rounded-xl" : shape}`}>
        {m.src ? <div className={`absolute ${shape === "rounded-full" ? "inset-y-1 left-1/2 aspect-square -translate-x-1/2 overflow-hidden rounded-full" : "inset-0 overflow-hidden"}`}><div className="h-full w-full" style={{ ...mediaStyle(m), backgroundSize: slot === "avatar" ? `${m.zoom * 100}%` : "cover" }} /></div> : <Upload className="h-5 w-5 text-primary transition-transform group-hover:-translate-y-0.5" />}
      </button>
      <input ref={file} type="file" accept="image/*" hidden onChange={onFile} />
      <div className="mt-2 flex gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <button data-testid={`media-settings-${slot}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-1.5 text-xs font-medium transition-colors hover:bg-primary/20"><SlidersHorizontal className="h-3.5 w-3.5" />Settings</button>
          </PopoverTrigger>
          <PopoverContent className="glass w-72 space-y-4 rounded-2xl" align="start">
            <div className="text-sm font-semibold">{label} settings</div>
            <SliderRow testid={`media-${slot}-zoom`} label="Zoom" value={m.zoom} min={1} max={4} step={0.05} unit="x" onChange={set("zoom")} />
            <SliderRow testid={`media-${slot}-blur`} label="Blur" value={m.blur} min={0} max={30} unit="px" onChange={set("blur")} />
            <SliderRow testid={`media-${slot}-rotate`} label="Rotate" value={m.rotate} min={-180} max={180} unit="°" onChange={set("rotate")} />
            <SliderRow testid={`media-${slot}-size`} label="Resize" value={m.size} min={50} max={200} unit="%" onChange={set("size")} />
            <SliderRow testid={`media-${slot}-x`} label="Position X" value={m.x} min={0} max={100} unit="%" onChange={set("x")} />
            <SliderRow testid={`media-${slot}-y`} label="Position Y" value={m.y} min={0} max={100} unit="%" onChange={set("y")} />
            <input data-testid={`media-${slot}-url`} className={inputCls} placeholder="or paste an image URL" defaultValue={m.src.startsWith("data:") ? "" : m.src} onBlur={(e) => e.target.value && set("src")(e.target.value)} />
            <button data-testid={`media-${slot}-reset`} onClick={() => Object.entries(DEFAULTS).forEach(([k, v]) => set(k)(v))} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" />Reset adjustments</button>
          </PopoverContent>
        </Popover>
        {m.src && <button data-testid={`media-remove-${slot}`} onClick={() => set("src")("")} className="grid w-8 place-items-center rounded-lg bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"><Trash2 className="h-3.5 w-3.5" /></button>}
      </div>
    </div>
  );
};

export default function MediaTab() {
  const { storageError } = useStore();
  return (
    <Panel title="Media" desc="Upload images, then fine-tune zoom, blur, rotation, size and position.">
      {storageError && <div className="mb-3 rounded-xl bg-red-500/10 p-2 text-xs text-red-500">{storageError}</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {SLOTS.map(([slot, label, max, shape]) => <MediaBox key={slot} slot={slot} label={label} max={max} shape={shape} />)}
      </div>
    </Panel>
  );
}
