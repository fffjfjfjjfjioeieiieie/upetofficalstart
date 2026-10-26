import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, Link2 } from "lucide-react";
import { useStore } from "../../../lib/store";
import { PLATFORMS, detectPlatform, iconUrl, BRAND } from "../../../lib/catalog";
import { Panel, SliderRow, ColorRow, ToggleRow, ChoiceChips, Field, inputCls, btnCls } from "../../../components/Controls";
import PlatformIcon from "../../../components/PlatformIcon";
import { DiscordWidget } from "../../../components/Widgets";

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

const platformLabel = (platform) => platform === "namemc" ? "NameMC" : platform[0].toUpperCase() + platform.slice(1);

const DiscordWidgetPanel = () => {
  const { user, setProfile } = useStore();
  const widget = user.profile.widgets.discord;
  const connection = user.connections.discord;
  const set = (key) => (value) => setProfile(`widgets.discord.${key}`, value);
  return <Panel title="Discord widget" desc="Discord identity comes from an authorized account connection." testid="widget-panel-discord">
    {connection ? <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border bg-background/40 p-3"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-[#5865f2]/15">{connection.avatar ? <img src={connection.avatar} alt="" className="h-full w-full object-cover" /> : <img src={iconUrl('discord', '5865f2')} alt="" className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{connection.username}</div><div className="truncate text-xs text-emerald-500">@{connection.handle || connection.username} · Connected</div></div><Link to="/dashboard/settings" className="text-xs font-semibold text-primary">Manage</Link></div>
      <ToggleRow testid="widget-discord-enabled" label="Show on profile" checked={widget.enabled} onChange={set("enabled")} />
      <div className="max-w-sm"><DiscordWidget cfg={widget} /></div>
      <div><p className="mb-2 text-xs text-muted-foreground">Card layout</p><ChoiceChips testid="widget-discord-layout" value={widget.layout || 'compact'} options={[["compact", "Compact"], ["expanded", "Expanded"]]} onChange={set('layout')} /></div>
      <div className="grid gap-3 md:grid-cols-2"><ToggleRow testid="widget-discord-banner" label="Show Discord banner" checked={widget.showBanner !== false} onChange={set('showBanner')} /><ToggleRow testid="widget-discord-badges" label="Show public Discord badges" checked={widget.showBadges !== false} onChange={set('showBadges')} /></div>
      <div className="grid gap-4 md:grid-cols-2"><SliderRow testid="widget-discord-alpha" label="Opacity" value={widget.alpha} min={0} max={1} step={0.01} onChange={set("alpha")} /><SliderRow testid="widget-discord-glow" label="Glow" value={widget.glow || 0} min={0} max={1} step={0.05} onChange={set('glow')} /><SliderRow testid="widget-discord-radius" label="Border radius" value={widget.radius} min={0} max={40} unit="px" onChange={set("radius")} /><ColorRow testid="widget-discord-accent" label="Accent colour" value={widget.accent} onChange={set("accent")} /></div>
      {!connection.fetchedAt && <p className="text-xs text-muted-foreground">Reconnect Discord in Settings to import your banner, avatar decoration, guild tag, and public badges.</p>}
    </div> : <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed bg-background/30 p-4"><div><p className="text-sm font-semibold">Connect Discord first</p><p className="mt-1 text-xs text-muted-foreground">You’ll sign in with Discord and approve basic identity access.</p></div><Link to="/dashboard/settings" className={btnCls}>Connect Discord</Link></div>}
  </Panel>;
};

export default function LinksTab() {
  const { user, setProfile } = useStore();
  const links = user.profile.links;
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const urlRef = useRef(null);
  const ls = user.profile.linkStyle;
  const setL = (k) => (v) => setProfile(`linkStyle.${k}`, v);
  const detected = detectPlatform(url);
  const preset = (pl) => { setUrl(BRAND[pl][1]); setLabel(""); setTimeout(() => { urlRef.current?.focus(); urlRef.current?.setSelectionRange(BRAND[pl][1].length, BRAND[pl][1].length); }, 0); };
  const add = (e) => {
    e.preventDefault();
    const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    try { new URL(normalizedUrl); } catch { return toast.error("Paste a complete link first"); }
    const platform = detectPlatform(normalizedUrl);
    setProfile("links", [...links, { id: Date.now().toString(36), url: normalizedUrl, label: label.trim() || platformLabel(platform), platform }]);
    setUrl(""); setLabel("");
    toast.success("Link added");
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
        <div className="rounded-2xl border border-primary/20 bg-primary/[.04] p-4">
          <form onSubmit={add} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,.45fr)_auto] md:items-end">
            <Field label="Paste a link">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input ref={urlRef} data-testid="link-url-input" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={`${inputCls} pl-10`} placeholder="youtube.com/@you" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            </Field>
            <Field label="Button text (optional)"><input data-testid="link-label-input" className={inputCls} placeholder={url ? platformLabel(detected) : "My channel"} value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
            <button data-testid="link-add-button" className={`${btnCls} h-11 justify-center px-5`}><Plus className="h-4 w-4" />Add link</button>
          </form>
          {url && <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><PlatformIcon platform={detected} color={`#${BRAND[detected][0]}`} size={15} /><span>Detected as {platformLabel(detected)}</span></div>}
        </div>
        <div className="mt-4" data-testid="link-presets">
          <div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-muted-foreground">Quick start</span><button type="button" onClick={() => setShowAllPlatforms((value) => !value)} className="flex items-center gap-1 text-xs font-semibold text-primary">{showAllPlatforms ? "Show less" : "More platforms"}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllPlatforms ? "rotate-180" : ""}`} /></button></div>
          <div className="flex flex-wrap gap-2">
            {(showAllPlatforms ? PLATFORMS : PLATFORMS.slice(0, 8)).map((pl) => (
              <button key={pl} type="button" aria-label={`Start a ${platformLabel(pl)} link`} data-testid={`link-preset-${pl}`} onClick={() => preset(pl)} className="flex h-9 items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/10">
                <PlatformIcon platform={pl} color={`#${BRAND[pl][0]}`} size={15} />{platformLabel(pl)}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-5 space-y-3">
          {links.map((l, i) => (
            <li key={l.id} data-testid={`link-row-${i}`} className="grid gap-3 rounded-2xl border bg-background/40 p-3 md:grid-cols-[44px_minmax(120px,.45fr)_minmax(180px,1fr)_130px_auto] md:items-center">
              <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ color: `#${BRAND[l.platform]?.[0] || BRAND.website[0]}`, background: `#${BRAND[l.platform]?.[0] || BRAND.website[0]}16` }}><PlatformIcon platform={l.platform} color="currentColor" size={20} /></span>
              <Field label="Button text"><input className="w-full bg-transparent text-sm font-semibold outline-none" value={l.label} onChange={(e) => edit(i, "label", e.target.value)} /></Field>
              <Field label="Destination"><input className="w-full min-w-0 bg-transparent text-xs text-muted-foreground outline-none" value={l.url} onChange={(e) => { edit(i, "url", e.target.value); edit(i, "platform", detectPlatform(e.target.value)); }} /></Field>
              <select aria-label="Platform icon" data-testid={`link-platform-${i}`} value={l.platform} onChange={(e) => edit(i, "platform", e.target.value)} className="h-10 min-w-0 rounded-xl border bg-background px-3 text-xs">
                {PLATFORMS.map((pl) => <option key={pl} value={pl}>{platformLabel(pl)}</option>)}
              </select>
              <div className="flex justify-end gap-1"><button type="button" title="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-white/5 disabled:opacity-25"><ArrowUp className="h-4 w-4" /></button><button type="button" title="Move down" disabled={i === links.length - 1} onClick={() => move(i, 1)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-white/5 disabled:opacity-25"><ArrowDown className="h-4 w-4" /></button><button type="button" title="Delete link" data-testid={`link-delete-${i}`} onClick={() => setProfile("links", links.filter((x) => x.id !== l.id))} className="grid h-9 w-9 place-items-center rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button></div>
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
      <DiscordWidgetPanel />
      <WidgetPanel id="tiktok" title="TikTok widget" fields={[["username", "TikTok username", "@username"], ["videoUrl", "Video URL to embed (optional)", "https://www.tiktok.com/@user/video/..."]]} />
    </>
  );
}
