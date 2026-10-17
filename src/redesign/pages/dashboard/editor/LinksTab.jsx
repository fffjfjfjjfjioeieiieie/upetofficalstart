import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Globe } from "lucide-react";
import { useStore } from "../../../lib/store";
import { PLATFORMS, detectPlatform, iconUrl, BRAND } from "../../../lib/catalog";
import { Panel, SliderRow, ColorRow, ToggleRow, Field, inputCls, btnCls } from "../../../components/Controls";

const WidgetPanel = ({ id, title, fields }) => {
  const { user, setProfile } = useStore();
  const w = user.profile.widgets[id];
  const set = (k) => (v) => setProfile(`widgets.${id}.${k}`, v);
  return (
    <Panel title={title} testid={`widget-panel-${id}`}>
      <div className="space-y-4">
        <ToggleRow testid={`widget-${id}-enabled`} label="Show on profile" checked={w.enabled} onChange={set("enabled")} />
        <div className="grid gap-3 md:grid-cols-2">
          {fields.map(([k, label, ph]) => <Field key={k} label={label}><input data-testid={`widget-${id}-${k}`} className={inputCls} placeholder={ph} value={w[k]} onChange={(e) => set(k)(e.target.value.trim())} /></Field>)}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <SliderRow testid={`widget-${id}-alpha`} label="Alpha" value={w.alpha} min={0} max={1} step={0.01} onChange={set("alpha")} />
          <SliderRow testid={`widget-${id}-radius`} label="Rounding" value={w.radius} min={0} max={32} unit="px" onChange={set("radius")} />
          <ColorRow testid={`widget-${id}-accent`} label="Accent" value={w.accent} onChange={set("accent")} />
        </div>
      </div>
    </Panel>
  );
};

export default function LinksTab() {
  const { user, setProfile } = useStore();
  const links = user.profile.links;
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const urlRef = useRef(null);
  const ls = user.profile.linkStyle;
  const setL = (k) => (v) => setProfile(`linkStyle.${k}`, v);
  const preset = (pl) => { setUrl(BRAND[pl][1]); setLabel(pl[0].toUpperCase() + pl.slice(1)); setTimeout(() => urlRef.current && urlRef.current.focus(), 0); };
  const add = (e) => {
    e.preventDefault();
    if (!/^https?:\/\//.test(url)) return toast.error("Link must start with http:// or https://");
    setProfile("links", [...links, { id: Date.now().toString(36), url, label: label || detectPlatform(url), platform: detectPlatform(url) }]);
    setUrl(""); setLabel("");
  };
  const move = (i, d) => {
    const next = [...links];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setProfile("links", next);
  };
  const edit = (i, k, v) => setProfile(`links[${i}].${k}`, v);
  return (
    <>
      <Panel title="Links" desc="Platform icons are detected from the URL automatically." testid="links-panel">
        <div className="mb-4 grid grid-cols-5 gap-2 sm:grid-cols-10" data-testid="link-presets">
          {PLATFORMS.map((pl) => (
            <button key={pl} type="button" title={pl} data-testid={`link-preset-${pl}`} onClick={() => preset(pl)} className="grid aspect-square place-items-center rounded-xl bg-[#0b1626] transition-transform duration-200 hover:-translate-y-1" style={{ boxShadow: `0 0 0 1px #${BRAND[pl][0]}33` }}>
              {iconUrl(pl) ? <img src={iconUrl(pl, BRAND[pl][0])} alt={pl} className="h-5 w-5" style={{ filter: `drop-shadow(0 0 6px #${BRAND[pl][0]})` }} /> : <Globe className="h-5 w-5 text-sky-300" />}
            </button>
          ))}
        </div>
        <form onSubmit={add} className="flex flex-col gap-2 md:flex-row">
          <input ref={urlRef} data-testid="link-url-input" className={inputCls} placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
          <input data-testid="link-label-input" className={`${inputCls} md:w-48`} placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <button data-testid="link-add-button" className={btnCls}><Plus className="h-4 w-4" />Add</button>
        </form>
        <ul className="mt-4 space-y-2">
          {links.map((l, i) => (
            <li key={l.id} data-testid={`link-row-${i}`} className="flex items-center gap-2 rounded-xl border bg-background/40 p-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15">{iconUrl(l.platform) ? <img src={iconUrl(l.platform, "38aaff")} alt="" className="h-4 w-4" /> : <Globe className="h-4 w-4 text-primary" />}</span>
              <input className="w-28 bg-transparent text-sm font-medium outline-none" value={l.label} onChange={(e) => edit(i, "label", e.target.value)} />
              <input className="min-w-0 flex-1 bg-transparent text-xs text-muted-foreground outline-none" value={l.url} onChange={(e) => edit(i, "url", e.target.value)} />
              <select data-testid={`link-platform-${i}`} value={l.platform} onChange={(e) => edit(i, "platform", e.target.value)} className="rounded-lg border bg-background px-2 py-1 text-xs">
                {PLATFORMS.map((pl) => <option key={pl}>{pl}</option>)}
              </select>
              <button disabled={i === 0} onClick={() => move(i, -1)} className="p-1 text-muted-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              <button disabled={i === links.length - 1} onClick={() => move(i, 1)} className="p-1 text-muted-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              <button data-testid={`link-delete-${i}`} onClick={() => setProfile("links", links.filter((x) => x.id !== l.id))} className="p-1 text-red-500"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
          {!links.length && <li className="text-sm text-muted-foreground">No links yet.</li>}
        </ul>
      </Panel>
      <Panel title="Link style" desc="Icons, colors and glow." testid="link-style">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-6">
            {[["mode", ["list", "icons"]], ["iconColor", ["brand", "accent", "white"]]].map(([k, opts]) => (
              <div key={k} className="flex gap-1.5">{opts.map((o) => <button key={o} data-testid={`link-style-${k}-${o}`} onClick={() => setL(k)(o)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${ls[k] === o ? "bg-primary text-primary-foreground" : "bg-primary/10 hover:bg-primary/20"}`}>{o}</button>)}</div>
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <SliderRow testid="link-glow" label="Glow" value={ls.glow} min={0} max={1.5} step={0.05} onChange={setL("glow")} />
            <SliderRow testid="link-icon-size" label="Icon size" value={ls.size} min={12} max={32} unit="px" onChange={setL("size")} />
            <SliderRow testid="link-radius" label="Rounding" value={ls.radius} min={0} max={24} unit="px" onChange={setL("radius")} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <ColorRow testid="link-glow-color" label="Glow color (custom)" value={ls.glowColor || "#6cc4ff"} onChange={setL("glowColor")} />
            <button data-testid="link-glow-brand" onClick={() => setL("glowColor")("")} className={`rounded-xl border px-3 py-2 text-xs ${!ls.glowColor ? "border-primary bg-primary/15" : "bg-background/40"}`}>Use brand colors for glow</button>
          </div>
        </div>
      </Panel>
      <WidgetPanel id="discord" title="Discord widget" fields={[["userId", "Discord user ID", "e.g. 94490510688792576"]]} />
      <WidgetPanel id="tiktok" title="TikTok widget" fields={[["username", "TikTok username", "@username"], ["videoUrl", "Video URL to embed (optional)", "https://www.tiktok.com/@user/video/..."]]} />
    </>
  );
}
