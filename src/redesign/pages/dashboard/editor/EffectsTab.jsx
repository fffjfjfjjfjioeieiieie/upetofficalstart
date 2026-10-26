import { useMemo, useState } from "react";
import { Search, Sparkles, Loader2, Type, CloudRain, Layers, ChevronRight, LockKeyhole } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { useStore } from "../../../lib/store";
import { useDecorations, TEXT_FX } from "../../../lib/catalog";
import { Panel, SliderRow, ColorRow, btnCls, ghostCls } from "../../../components/Controls";
import { Avatar, FxText, BackgroundFx, OverlayFx } from "../../../components/ProfileBits";

const UPCOMING_BACKGROUND_FX = new Set(["aurora", "stars", "fireflies", "bubbles", "embers", "hearts", "sakura", "matrix"]);

const GROUPS = [
  ["text", "Text effects", TEXT_FX, Type],
  ["background", "Background effects", ["none", "rain", "snow", "thunder", "spotlight", ...UPCOMING_BACKGROUND_FX], CloudRain],
  ["overlay", "Overlay effects", ["none", "grain", "vhs", "rain", "shine"], Layers],
];

const Preview = ({ group, kind, amount = 50, color = "#ffffff" }) => (
  <div className="relative grid h-20 place-items-center overflow-hidden rounded-xl bg-[#0b1626]">
    {group === "background" && <BackgroundFx kind={kind} amount={amount} color={color} />}
    {group === "overlay" && <div className="absolute inset-3 rounded-lg bg-gradient-to-br from-sky-400/60 to-indigo-500/50" />}
    {group === "overlay" && <OverlayFx kind={kind} />}
    {group === "text" ? <FxText fx={kind} text="user.pet" className="relative font-display text-base font-bold" style={{ color, '--fx-color': color }} /> : group === "background" && <span className="relative text-[10px] uppercase tracking-widest text-white/40">{kind}</span>}
  </div>
);

const SECTIONS = [["all", "All"], ["animated", "Animated"], ["static", "Static"]];

const DecorationThumb = ({ item, selected }) => {
  const preferred = selected && item.animated ? item.url : (item.still || item.url);
  const [fallback, setFallback] = useState(false);
  const src = fallback ? item.url : preferred;
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (src !== item.url) {
      setFallback(true);
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <span className="relative flex h-full w-full flex-col items-center justify-center gap-1 text-primary/70">
        <Sparkles className="h-5 w-5" />
        <span className="max-w-full truncate px-1 text-[9px] text-muted-foreground">{item.label}</span>
      </span>
    );
  }

  return <img src={src} alt={item.label} loading="lazy" onError={handleError} className="relative h-full w-full object-contain" />;
};

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
      <DialogContent className="glass h-[100dvh] max-h-[100dvh] w-screen max-w-none overflow-hidden rounded-none border-0 p-0 sm:h-[min(92dvh,760px)] sm:max-h-[92dvh] sm:w-[calc(100vw-2rem)] sm:max-w-4xl sm:rounded-[1.5rem] sm:border" data-testid="decoration-dialog">
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_280px] md:grid-rows-1">
          <div className="flex min-h-0 flex-col px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6">
            <DialogHeader className="pr-8 text-left"><DialogTitle className="font-display">Avatar decoration</DialogTitle></DialogHeader>
            <div className="mt-4 flex items-center gap-2 rounded-xl border bg-background/50 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input data-testid="decoration-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${items.length} decorations`} className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            <div className="scroll-thin mt-3 flex shrink-0 gap-1.5 overflow-x-auto pb-1">
              {SECTIONS.map(([id, l]) => <button key={id} data-testid={`decoration-section-${id}`} onClick={() => setSection(id)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${section === id ? "bg-primary text-primary-foreground" : "bg-primary/10 hover:bg-primary/20"}`}>{l}</button>)}
            </div>
            <p className="mt-2 text-[10px] leading-5 text-muted-foreground">Some animated thumbnails use still frames. Select a decoration to preview its animation.</p><div className="scroll-thin mt-3 grid min-h-0 flex-1 grid-cols-3 content-start gap-2 overflow-y-auto pb-2 pr-1 min-[380px]:grid-cols-4 sm:mt-4 sm:grid-cols-5">
              <button data-testid="decoration-none" onClick={() => setSel(null)} className={`grid aspect-square place-items-center rounded-xl border text-xs transition-colors ${!sel ? "border-primary bg-primary/15" : "hover:bg-primary/10"}`}>None</button>
              {loading && <div className="col-span-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Fetching from Discord CDN…</div>}
              {!loading && !list.length && <p className="col-span-full py-6 text-center text-xs text-muted-foreground">{q ? "No decorations match this search." : `No ${section} decorations in this catalogue.`}</p>}
              {list.map((d) => (
                <button key={d.id} title={d.label} data-testid={`decoration-item-${d.id}`} onClick={() => setSel(d)} className={`group relative aspect-square rounded-xl border p-1 transition-colors ${sel?.id === d.id ? "border-primary bg-primary/15" : "hover:bg-primary/10"}`}>
                  <div className="absolute inset-[22%] rounded-full bg-primary/20" />
                  <DecorationThumb item={d} selected={sel?.id === d.id}/><span className="pointer-events-none absolute inset-x-1 bottom-1 rounded bg-background/85 px-1 text-center text-[8px] leading-4 text-muted-foreground">{d.animated ? "Animated" : "Static"}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="border-t bg-background/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:flex md:flex-col md:border-l md:border-t-0 md:bg-background/30 md:p-6">
            <div className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground md:block">Preview</div>
            <div className="hidden flex-1 place-items-center md:my-6 md:grid">
              <Avatar media={p.media.avatar} name={p.username} size={128} decoration={sel} hue={hue} decoSize={size} />
            </div>
            <div className="mb-3 flex items-center gap-3 md:mb-4 md:block">
              <div className="grid h-14 w-14 shrink-0 place-items-center md:hidden"><Avatar media={p.media.avatar} name={p.username} size={52} decoration={sel} hue={hue} decoSize={size} /></div>
              <div className="min-w-0 flex-1 md:text-center"><div className="text-[10px] uppercase tracking-[.18em] text-muted-foreground md:hidden">Selected</div><div className="truncate text-sm font-semibold" data-testid="decoration-selected-label">{sel ? sel.label : "No decoration"}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:space-y-4">
              <SliderRow testid="decoration-hue" label="Hue" value={hue} min={0} max={360} unit="°" onChange={setHue} />
              <SliderRow testid="decoration-size" label="Size" value={size} min={100} max={150} unit="%" onChange={setSize} />
            </div>
            <div className="mt-4 flex gap-2 md:mt-6">
              <button className={`${ghostCls} flex-1`} onClick={() => onOpenChange(false)}>Cancel</button>
              <button data-testid="decoration-confirm" className={`${btnCls} flex-1`} onClick={confirm}>Save decoration</button>
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
  const founder = user.role === "founder";
  const backgroundAmount = user.profile.effects.backgroundAmount ?? 50;
  const backgroundColor = user.profile.effects.backgroundColor || "#ffffff";
  const textColor = user.profile.effects.textColor || user.profile.card.accent || "#6cc4ff";
  const list = kinds.filter((k) => k.includes(q.toLowerCase()));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass grid max-h-[calc(100dvh-1rem)] max-w-3xl grid-rows-[auto_auto_auto_minmax(0,1fr)] overflow-hidden rounded-[1.5rem]" data-testid={`effect-menu-${key}`}>
        <DialogHeader><DialogTitle className="font-display">{title}</DialogTitle></DialogHeader>
        <div className="flex items-center gap-2 rounded-xl border bg-background/50 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input data-testid={`effect-menu-search-${key}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${kinds.length} effects`} className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        {key === "background" && <div className="grid gap-3 rounded-2xl border border-primary/15 bg-primary/[.06] p-3 sm:grid-cols-2">
          <SliderRow testid="background-effect-amount" label="How much" value={backgroundAmount} min={0} max={100} unit="%" onChange={(value) => setProfile("effects.backgroundAmount", value)} />
          <ColorRow testid="background-effect-color" label="Effect color" value={backgroundColor} onChange={(value) => setProfile("effects.backgroundColor", value)} />
        </div>}
        {key === "text" && <div className="rounded-2xl border border-primary/15 bg-primary/[.06] p-3"><ColorRow testid="text-effect-color" label="Effect color" value={textColor} onChange={(value) => setProfile("effects.textColor", value)} /></div>}
        <div className="scroll-thin grid min-h-0 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
          {list.map((k) => {
            const locked = key === "background" && UPCOMING_BACKGROUND_FX.has(k) && !founder;
            return (
              <button key={k} type="button" disabled={locked} aria-label={locked ? `${k} — coming soon` : k} data-testid={`effect-${key}-${k}`} onClick={() => !locked && setProfile(`effects.${key}`, k)} className={`rounded-2xl border p-2 text-left transition-all duration-200 ${locked ? "cursor-not-allowed bg-background/30" : "hover:-translate-y-0.5 hover:bg-primary/10"} ${current === k ? "border-primary bg-primary/15 ring-2 ring-primary/30" : "bg-background/40"}`}>
                <div className="relative overflow-hidden rounded-xl">
                  <div className={locked ? "opacity-55 blur-[1.5px]" : ""}><Preview group={key} kind={k} amount={backgroundAmount} color={key === "text" ? textColor : backgroundColor} /></div>
                  {locked && <div className="absolute inset-0 grid place-items-center bg-black/25"><span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/75 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.13em] text-white shadow-xl backdrop-blur-md"><LockKeyhole className="h-3 w-3 text-primary" />Coming soon</span></div>}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 px-1 text-xs font-medium capitalize"><span>{k}</span>{key === "background" && UPCOMING_BACKGROUND_FX.has(k) && founder && <span className="text-[9px] uppercase tracking-wider text-primary">Founder preview</span>}</div>
              </button>
            );
          })}
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
  const tile = "group flex w-full items-center gap-3 rounded-2xl border bg-background/40 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/10 sm:gap-4 sm:p-4";
  return (
    <Panel title="Effects & VFX" desc="Pick a section to open its effect menu." testid="effects-sections">
      <div className="grid gap-3 md:grid-cols-2">
        {GROUPS.map((g) => {
          const Icon = g[3];
          return (
            <button key={g[0]} data-testid={`effects-section-${g[0]}`} onClick={() => setMenu(g)} className={tile}>
              <div className="w-20 shrink-0 sm:w-28"><Preview group={g[0]} kind={p.effects[g[0]]} amount={p.effects.backgroundAmount} color={g[0] === "text" ? p.effects.textColor : p.effects.backgroundColor} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" />{g[1]}</div>
                <div className="mt-1 text-xs capitalize text-muted-foreground">{g[2].length} options · current: {p.effects[g[0]]}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          );
        })}
        <button data-testid="open-decoration-picker" onClick={() => setOpen(true)} className={tile}>
          <div className="grid w-20 shrink-0 place-items-center sm:w-28"><Avatar media={p.media.avatar} name={p.username} size={64} decoration={p.effects.decoration} hue={p.effects.decoHue} decoSize={p.effects.decoSize} /></div>
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
