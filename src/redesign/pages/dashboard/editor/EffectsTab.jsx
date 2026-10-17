import { useMemo, useState } from "react";
import { Search, Sparkles, Loader2, Type, CloudRain, Layers, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { useStore } from "../../../lib/store";
import { useDecorations, TEXT_FX } from "../../../lib/catalog";
import { Panel, SliderRow, btnCls, ghostCls } from "../../../components/Controls";
import { Avatar, FxText, BackgroundFx, OverlayFx } from "../../../components/ProfileBits";

const GROUPS = [
  ["text", "Text effects", TEXT_FX, Type],
  ["background", "Background effects", ["none", "rain", "snow", "thunder", "spotlight"], CloudRain],
  ["overlay", "Overlay effects", ["none", "grain", "vhs", "rain", "shine"], Layers],
];

const Preview = ({ group, kind }) => (
  <div className="relative grid h-20 place-items-center overflow-hidden rounded-xl bg-[#0b1626]">
    {group === "background" && <BackgroundFx kind={kind} />}
    {group === "overlay" && <div className="absolute inset-3 rounded-lg bg-gradient-to-br from-sky-400/60 to-indigo-500/50" />}
    {group === "overlay" && <OverlayFx kind={kind} />}
    {group === "text" ? <FxText fx={kind} text="user.pet" className="relative font-display text-base font-bold text-white" /> : group === "background" && <span className="relative text-[10px] uppercase tracking-widest text-white/40">{kind}</span>}
  </div>
);

const SECTIONS = [["all", "All"], ["animated", "Animated"], ["static", "Static"]];

const DecorationPicker = ({ open, onOpenChange }) => {
  const { user, setProfile } = useStore();
  const p = user.profile;
  const { loading, items } = useDecorations();
  const [q, setQ] = useState("");
  const [section, setSection] = useState("all");
  const [sel, setSel] = useState(p.effects.decoration);
  const [hue, setHue] = useState(p.effects.decoHue);
  const [size, setSize] = useState(p.effects.decoSize);
  const list = useMemo(() => items.filter((d) => d.label.toLowerCase().includes(q.toLowerCase()) && (section === "all" || (section === "animated" ? d.animated : !d.animated))), [items, q, section]);
  const confirm = () => {
    setProfile("effects.decoration", sel ? { id: sel.id, label: sel.label, url: sel.url } : null);
    setProfile("effects.decoHue", hue);
    setProfile("effects.decoSize", size);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-4xl rounded-[1.5rem] p-0" data-testid="decoration-dialog">
        <div className="grid md:grid-cols-[1fr_280px]">
          <div className="p-6">
            <DialogHeader><DialogTitle className="font-display">Avatar decoration</DialogTitle></DialogHeader>
            <div className="mt-4 flex items-center gap-2 rounded-xl border bg-background/50 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input data-testid="decoration-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${items.length} decorations`} className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            <div className="mt-3 flex gap-1.5">
              {SECTIONS.map(([id, l]) => <button key={id} data-testid={`decoration-section-${id}`} onClick={() => setSection(id)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${section === id ? "bg-primary text-primary-foreground" : "bg-primary/10 hover:bg-primary/20"}`}>{l}</button>)}
            </div>
            <div className="scroll-thin mt-4 grid max-h-[420px] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5">
              <button data-testid="decoration-none" onClick={() => setSel(null)} className={`grid aspect-square place-items-center rounded-xl border text-xs transition-colors ${!sel ? "border-primary bg-primary/15" : "hover:bg-primary/10"}`}>None</button>
              {loading && <div className="col-span-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Fetching from Discord CDN…</div>}
              {list.map((d) => (
                <button key={d.id} title={d.label} data-testid={`decoration-item-${d.id}`} onClick={() => setSel(d)} className={`group relative aspect-square rounded-xl border p-1 transition-colors ${sel?.id === d.id ? "border-primary bg-primary/15" : "hover:bg-primary/10"}`}>
                  <div className="absolute inset-[22%] rounded-full bg-primary/20" />
                  <img src={d.still} alt={d.label} loading="lazy" className="relative h-full w-full object-contain group-hover:hidden" />
                  <img src={d.url} alt="" loading="lazy" className="relative hidden h-full w-full object-contain group-hover:block" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col border-l bg-background/30 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview</div>
            <div className="my-6 grid flex-1 place-items-center">
              <Avatar media={p.media.avatar} name={p.username} size={128} decoration={sel} hue={hue} decoSize={size} />
            </div>
            <div className="mb-4 truncate text-center text-sm font-semibold" data-testid="decoration-selected-label">{sel ? sel.label : "No decoration"}</div>
            <div className="space-y-4">
              <SliderRow testid="decoration-hue" label="Hue" value={hue} min={0} max={360} unit="°" onChange={setHue} />
              <SliderRow testid="decoration-size" label="Size" value={size} min={100} max={150} unit="%" onChange={setSize} />
            </div>
            <div className="mt-6 flex gap-2">
              <button className={`${ghostCls} flex-1`} onClick={() => onOpenChange(false)}>Cancel</button>
              <button data-testid="decoration-confirm" className={`${btnCls} flex-1`} onClick={confirm}>Confirm</button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EffectMenu = ({ group, onClose }) => {
  const { user, setProfile } = useStore();
  const [key, title, kinds] = group;
  const [q, setQ] = useState("");
  const current = user.profile.effects[key];
  const list = kinds.filter((k) => k.includes(q.toLowerCase()));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass max-w-3xl rounded-[1.5rem]" data-testid={`effect-menu-${key}`}>
        <DialogHeader><DialogTitle className="font-display">{title}</DialogTitle></DialogHeader>
        <div className="flex items-center gap-2 rounded-xl border bg-background/50 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input data-testid={`effect-menu-search-${key}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${kinds.length} effects`} className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div className="scroll-thin grid max-h-[460px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
          {list.map((k) => (
            <button key={k} data-testid={`effect-${key}-${k}`} onClick={() => setProfile(`effects.${key}`, k)} className={`rounded-2xl border p-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${current === k ? "border-primary bg-primary/15 ring-2 ring-primary/30" : "bg-background/40 hover:bg-primary/10"}`}>
              <Preview group={key} kind={k} />
              <div className="mt-2 px-1 text-xs font-medium capitalize">{k}</div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function EffectsTab() {
  const { user } = useStore();
  const p = user.profile;
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const tile = "group flex w-full items-center gap-4 rounded-2xl border bg-background/40 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/10";
  return (
    <Panel title="Effects & VFX" desc="Pick a section to open its effect menu." testid="effects-sections">
      <div className="grid gap-3 md:grid-cols-2">
        {GROUPS.map((g) => {
          const Icon = g[3];
          return (
            <button key={g[0]} data-testid={`effects-section-${g[0]}`} onClick={() => setMenu(g)} className={tile}>
              <div className="w-28 shrink-0"><Preview group={g[0]} kind={p.effects[g[0]]} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" />{g[1]}</div>
                <div className="mt-1 text-xs capitalize text-muted-foreground">{g[2].length} options · current: {p.effects[g[0]]}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          );
        })}
        <button data-testid="open-decoration-picker" onClick={() => setOpen(true)} className={tile}>
          <div className="grid w-28 shrink-0 place-items-center"><Avatar media={p.media.avatar} name={p.username} size={64} decoration={p.effects.decoration} hue={p.effects.decoHue} decoSize={p.effects.decoSize} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" />Avatar decoration</div>
            <div className="mt-1 truncate text-xs text-muted-foreground">{p.effects.decoration ? p.effects.decoration.label : "None selected"} · hue {p.effects.decoHue}°</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </button>
      </div>
      {menu && <EffectMenu group={menu} onClose={() => setMenu(null)} />}
      {open && <DecorationPicker open={open} onOpenChange={setOpen} />}
    </Panel>
  );
}
