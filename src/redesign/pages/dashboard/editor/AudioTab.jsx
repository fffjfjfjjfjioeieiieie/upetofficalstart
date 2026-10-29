import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Music, Trash2, Play, SkipBack, SkipForward, Link2, ShieldCheck } from "lucide-react";
import { useStore, fileToDataUrl } from "../../../lib/store";
import { ChoiceChips, ColorRow, Panel, SliderRow, ToggleRow, Field, inputCls } from "../../../components/Controls";
import { AUDIO_INPUT_ACCEPT } from "../../../../shared/mediaTypes";
import { MUSIC_PROVIDER_LABELS, parseMusicEmbed } from "../../../../shared/musicEmbeds";
import StreamingPlayer from "../../../components/StreamingPlayer";

const alphaHex = (value) => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0");

const PreviewCover = ({ audio, className = "" }) => audio.cover
  ? <img src={audio.cover} alt="" className={`object-cover ${className}`} />
  : <span className={`grid place-items-center bg-white/10 ${className}`}><Music className="h-5 w-5 opacity-60" /></span>;

const ProgressPreview = ({ audio, progress = 38 }) => {
  const height = audio.playerProgressHeight ?? 4;
  const color = audio.playerProgressColor || "#a69dd2";
  const rounded = audio.playerProgressStyle !== "line";
  const glow = audio.playerProgressStyle === "glow" || audio.playerProgressGlow;
  return <div className="relative w-full overflow-visible bg-white/10" style={{ height, borderRadius: rounded ? 999 : 0 }}><span className="absolute inset-y-0 left-0" style={{ width: `${progress}%`, borderRadius: rounded ? 999 : 0, background: color, boxShadow: glow ? `0 0 10px ${color}` : undefined }} />{audio.playerProgressStyle === "rounded" && <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b1626]" style={{ left: `${progress}%`, background: color }} />}</div>;
};

const ExpandedPreview = ({ audio, accent }) => {
  const effect = audio.expandedEffect || "none";
  const text = audio.expandedTextColor || "#ffffff";
  const bg = audio.expandedBackground || "#111319";
  const art = audio.expandedStyle || "vinyl";
  return <div className="mx-auto w-full max-w-[390px] overflow-hidden border border-white/10 p-5 shadow-2xl" style={{ color: text, borderRadius: Math.min(audio.expandedRadius ?? 30, 36), backgroundColor: `${bg}${alphaHex(audio.expandedOpacity ?? .98)}`, backgroundImage: effect === "gradient" ? `radial-gradient(circle at 50% 0%, ${accent}55, transparent 58%)` : undefined, backdropFilter: `blur(${(audio.expandedBlur ?? 16) + (effect === "glass" ? 10 : 0)}px)`, boxShadow: effect === "glow" ? `0 0 34px ${accent}65` : undefined }}>
    <div className="mb-4 text-center"><p className="text-[9px] font-semibold uppercase tracking-[.25em] opacity-40">Now playing</p><p className="mt-1 truncate font-display text-sm font-bold">{audio.title || "Track title"}</p><p className="truncate text-[10px] opacity-55">{audio.artist || "Artist"}</p></div>
    {art === "minimal" ? <div className="mx-auto mb-5 h-1 w-16 rounded-full" style={{ background: accent }} /> : <div className={`relative mx-auto mb-5 grid aspect-square w-36 place-items-center overflow-hidden ${art === "vinyl" ? "rounded-full bg-[repeating-radial-gradient(circle,#181a20_0px,#181a20_2px,#090a0d_3px,#090a0d_6px)]" : "rounded-2xl"}`}>{art === "vinyl" ? <PreviewCover audio={audio} className="h-[52%] w-[52%] rounded-full border-4 border-black" /> : <PreviewCover audio={audio} className="h-full w-full" />}</div>}
    <ProgressPreview audio={audio} progress={42} />
    {audio.expandedShowTimes !== false && <div className="mt-1.5 flex justify-between font-mono text-[9px] opacity-40"><span>0:48</span><span>3:12</span></div>}
    <div className="mt-4 flex items-center justify-center gap-6">{audio.expandedShowSkip !== false && <SkipBack className="h-4 w-4 opacity-60" />}<span className="grid h-10 w-10 place-items-center rounded-full text-black" style={{ background: accent }}><Play className="h-4 w-4 fill-current" /></span>{audio.expandedShowSkip !== false && <SkipForward className="h-4 w-4 opacity-60" />}</div>
    {audio.expandedShowLyrics !== false && <div className="mt-5 border-t border-white/10 pt-4 text-center text-xs"><p className="font-semibold">The current lyric appears here</p><p className="mt-2 opacity-35">and the next line follows</p></div>}
  </div>;
};

export default function AudioTab() {
  const { user, setProfile, updateProfile } = useStore();
  const a = user.profile.audio;
  const [sourceMode, setSourceMode] = useState(a.sourceType === "embed" ? "embed" : "upload");
  const [streamingUrl, setStreamingUrl] = useState(a.sourceUrl || "");
  const [uploadRights, setUploadRights] = useState(false);
  const isEmbed = a.sourceType === "embed" && Boolean(a.embedUrl);
  const sideLyricsForceMobile = Boolean(a.lyrics?.enabled && ["left", "right"].includes(a.lyrics?.display));
  const showExpandedSettings = Boolean(a.expandedEnabled) || sideLyricsForceMobile;
  const set = (k) => (v) => setProfile(`audio.${k}`, v);
  const track = useRef(null);
  const cover = useRef(null);
  const applyStreamingLink = () => {
    const parsed = parseMusicEmbed(streamingUrl);
    if (!parsed) return toast.error("Paste a full Spotify, YouTube Music, YouTube, or SoundCloud link.");
    updateProfile({ "audio.sourceType": "embed", "audio.sourceUrl": parsed.sourceUrl, "audio.embedUrl": parsed.embedUrl, "audio.embedProvider": parsed.provider, "audio.src": "", "audio.autoplay": false, "audio.lyrics.enabled": false });
    setStreamingUrl(parsed.sourceUrl);
    toast.success(`${MUSIC_PROVIDER_LABELS[parsed.provider]} player added`);
  };
  const useUpload = () => {
    setSourceMode("upload");
    if (isEmbed) updateProfile({ "audio.sourceType": "upload", "audio.sourceUrl": "", "audio.embedUrl": "", "audio.embedProvider": "" });
  };
  const onTrack = async (e) => {
    const input = e.currentTarget;
    const f = input.files[0];
    if (!f) return;
    if (!uploadRights) {
      input.value = "";
      return toast.error("Confirm that you own this audio or have permission to use it.");
    }
    if (f.size > 20 * 1024 * 1024) {
      input.value = "";
      return toast.error("Audio files can be up to 20 MB.");
    }
    try {
      const src = await fileToDataUrl(f, 900, 'audio');
      updateProfile({ "audio.src": src, "audio.sourceType": "upload", "audio.sourceUrl": "", "audio.embedUrl": "", "audio.embedProvider": "", ...(!a.title ? { "audio.title": f.name.replace(/\.[^.]+$/, "") } : {}) });
      toast.success("Audio uploaded");
    } catch (error) {
      toast.error(error?.message || 'Audio could not be uploaded');
    } finally {
      input.value = "";
    }
  };
  const onCover = async (e) => {
    const input = e.currentTarget;
    const f = input.files[0];
    if (!f) return;
    try {
      set("cover")(await fileToDataUrl(f, 200, 'cover'));
      toast.success("Cover art updated");
    }
    catch (error) { toast.error(error?.message || 'Cover art could not be uploaded'); }
    finally { input.value = ""; }
  };
  const removeCover = () => {
    set("cover")("");
    toast.success("Cover art removed");
  };
  return (
    <>
      <Panel title="Music source" desc="Use an official streaming player, or upload audio you have the right to use." testid="audio-panel">
        <ChoiceChips testid="audio-source" value={sourceMode} options={[["embed", "Streaming link"], ["upload", "Own upload"]]} onChange={(value) => { if (value === "upload") useUpload(); else setSourceMode("embed"); }} />
        <input ref={cover} type="file" accept="image/*" hidden onChange={onCover} />
        {sourceMode === "embed" ? <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/[.04] p-4">
            <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><Link2 className="h-5 w-5" /></span><div><p className="text-sm font-semibold">Paste a song, album, or playlist link</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Supports Spotify, YouTube Music, YouTube, and public SoundCloud links. It appears through the provider's official player.</p></div></div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input data-testid="streaming-url" className={`${inputCls} min-w-0 flex-1`} value={streamingUrl} onChange={(event) => setStreamingUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyStreamingLink(); } }} placeholder="https://open.spotify.com/track/…" inputMode="url" /><button type="button" onClick={applyStreamingLink} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Add player</button></div>
          </div>
          {isEmbed && <div className="rounded-2xl border border-white/10 bg-[#0b1626] p-4"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-primary">Mini-player preview</span><button type="button" onClick={() => { updateProfile({ "audio.sourceType": "upload", "audio.sourceUrl": "", "audio.embedUrl": "", "audio.embedProvider": "" }); setStreamingUrl(""); }} className="flex items-center gap-1.5 text-xs text-red-400"><Trash2 className="h-3.5 w-3.5" />Remove</button></div><StreamingPlayer audio={a} accent={user.profile.card.accent} preview /><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Title"><input data-testid="streaming-title" className={inputCls} value={a.title} placeholder={MUSIC_PROVIDER_LABELS[a.embedProvider] || "Track title"} onChange={(event) => set("title")(event.target.value)} /></Field><Field label="Artist"><input data-testid="streaming-artist" className={inputCls} value={a.artist} placeholder="Artist" onChange={(event) => set("artist")(event.target.value)} /></Field></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => cover.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/5"><Upload className="h-4 w-4 text-primary" />{a.cover ? "Replace mini-player artwork" : "Add mini-player artwork"}</button>{a.cover && <button type="button" data-testid="streaming-cover-remove" onClick={removeCover} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" />Remove artwork</button>}</div></div>}
          <p className="text-xs leading-relaxed text-muted-foreground">Visitors see this compact player first. Tapping it opens the official provider player. Spotify may limit unauthenticated listeners to a preview.</p>
        </div> : <div className="mt-5">
          <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#0b1626] p-4"><input type="checkbox" checked={uploadRights} onChange={(event) => setUploadRights(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><ShieldCheck className="h-5 w-5 shrink-0 text-primary" /><span><span className="block text-sm font-semibold">I own this audio or have permission to use it</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Only upload music you created, licensed, or have permission to publish. Upet cannot determine ownership just by listening to a file.</span></span></label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <button type="button" data-testid="audio-upload" disabled={!uploadRights} onClick={() => track.current.click()} className="glass grid h-28 place-items-center rounded-2xl border-dashed transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"><span className="flex flex-col items-center gap-2 text-xs"><Music className="h-5 w-5 text-primary" />{a.src ? "Replace audio" : "Upload audio"}</span></button>
            <div className="relative h-28">
              <button type="button" data-testid="audio-cover-upload" onClick={() => cover.current?.click()} className="glass group relative grid h-full w-full place-items-center overflow-hidden rounded-2xl transition-colors hover:bg-primary/10">{a.cover ? <><img src={a.cover} alt="" className="absolute inset-0 h-full w-full object-cover" /><span className="relative rounded-lg bg-black/65 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Replace artwork</span></> : <span className="flex flex-col items-center gap-2 text-xs"><Upload className="h-5 w-5 text-primary" />Cover art</span>}</button>
              {a.cover && <button type="button" data-testid="audio-cover-remove" onClick={removeCover} aria-label="Remove cover art" title="Remove cover art" className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-red-400/30 bg-black/80 text-red-300 shadow-lg transition-colors hover:bg-red-500 hover:text-white"><Trash2 className="h-4 w-4" /></button>}
            </div>
            {a.src && <button type="button" data-testid="audio-remove" onClick={() => set("src")("")} className="glass grid h-28 place-items-center rounded-2xl text-xs text-red-500 transition-colors hover:bg-red-500/10"><span className="flex flex-col items-center gap-2"><Trash2 className="h-5 w-5" />Remove</span></button>}
          </div>
          <input ref={track} type="file" accept={AUDIO_INPUT_ACCEPT} hidden onChange={onTrack} />
          <div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Title"><input data-testid="audio-title" className={inputCls} value={a.title} onChange={(e) => set("title")(e.target.value)} /></Field><Field label="Artist"><input data-testid="audio-artist" className={inputCls} value={a.artist} onChange={(e) => set("artist")(e.target.value)} /></Field></div>
        </div>}
      </Panel>
      {sourceMode === "embed" && isEmbed && <Panel title="Streaming mini-player" desc="Style the compact player visitors see before opening the provider." testid="streaming-player-appearance">
        <div className="space-y-5">
          <div><p className="mb-2 text-xs text-muted-foreground">Placement</p><ChoiceChips testid="streaming-player-placement" value={a.playerPlacement || "card"} options={[["card", "Profile card"], ["left", "Float left"], ["right", "Float right"], ["button", "Corner button"]]} onChange={set("playerPlacement")} /></div>
          <div><p className="mb-2 text-xs text-muted-foreground">Treatment</p><ChoiceChips testid="streaming-player-effect" value={a.playerEffect || "none"} options={[["none", "Original"], ["glow", "Glow"], ["glass", "Glass"], ["gradient", "Accent wash"], ["scanlines", "Scan lines"]]} onChange={set("playerEffect")} /></div>
          <div className="grid gap-5 md:grid-cols-3"><SliderRow label="Panel alpha" value={a.playerOpacity ?? .3} min={0} max={1} step={.01} onChange={set("playerOpacity")} /><SliderRow label="Player size" value={a.playerScale ?? 100} min={70} max={140} unit="%" onChange={set("playerScale")} /><SliderRow label="Rounding" value={a.playerRadius ?? 12} min={0} max={40} unit="px" onChange={set("playerRadius")} /><SliderRow label="Glass blur" value={a.playerBlur ?? 0} min={0} max={24} unit="px" onChange={set("playerBlur")} /></div>
          <div className="grid gap-3 md:grid-cols-2"><ColorRow label="Panel" value={a.playerBackground || "#000000"} onChange={set("playerBackground")} /><ColorRow label="Text" value={a.playerTextColor || "#ffffff"} onChange={set("playerTextColor")} /><ToggleRow label="Show artist" checked={a.playerShowArtist !== false} onChange={set("playerShowArtist")} /><ToggleRow testid="streaming-player-border" label="Show player border" checked={a.playerBorder !== false} onChange={set("playerBorder")} /></div>
        </div>
      </Panel>}
      {sourceMode !== "embed" && <>
      <Panel title="Playback" testid="audio-playback">
        <div className="grid gap-4 md:grid-cols-3">
          <SliderRow testid="audio-volume" label="Volume" value={a.volume} min={0} max={1} step={0.01} onChange={set("volume")} />
          <ToggleRow testid="audio-autoplay" label="Autoplay on enter" checked={a.autoplay} onChange={set("autoplay")} />
          <ToggleRow testid="audio-loop" label="Loop" checked={a.loop} onChange={set("loop")} />
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div><p className="mb-2 text-xs text-muted-foreground">Mini-player placement</p><ChoiceChips testid="player-placement" value={a.playerPlacement || "card"} options={[["card", "Profile card"], ["left", "Float left"], ["right", "Float right"], ["button", "Corner button"]]} onChange={set("playerPlacement")} /></div>
          <div><p className="mb-2 text-xs text-muted-foreground">Popup direction</p><ChoiceChips testid="popup-side" value={a.popupSide || "left"} options={[["left", "From left"], ["right", "From right"]]} onChange={set("popupSide")} /></div>
          <div className="md:col-span-2"><ToggleRow testid="audio-popup-on-load" label="Show the visual player popup when the page opens" checked={Boolean(a.popupOnLoad)} onChange={set("popupOnLoad")} /><p className="mt-2 text-xs text-muted-foreground">The separate autoplay setting controls whether music starts.</p></div>
        </div>
      </Panel>
      <Panel title="Mini-player appearance" desc="Tune the small profile player. Defaults keep its original compact look." testid="audio-player-appearance">
        <div className="mb-5 flex justify-center rounded-xl bg-[#0b1626] p-5">
          <div className="relative flex w-full max-w-md items-center gap-3 overflow-hidden border p-2.5 pb-3.5 transition-all" style={{ borderRadius: a.playerRadius ?? 12, color: a.playerTextColor || "#fff", backgroundColor: `${a.playerBackground || "#000000"}${alphaHex(a.playerOpacity ?? .3)}`, backgroundImage: a.playerEffect === "gradient" ? `linear-gradient(135deg, transparent, ${user.profile.card.accent}70)` : a.playerEffect === "scanlines" ? "repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,.08) 4px, transparent 5px)" : undefined, borderColor: a.playerBorder === false ? "transparent" : "rgba(255,255,255,.12)", backdropFilter: `blur(${(a.playerBlur || 0) + (a.playerEffect === "glass" ? 12 : 0)}px)`, boxShadow: a.playerEffect === "glow" ? `0 0 24px ${user.profile.card.accent}70` : undefined, transform: `scale(${Math.min(115, a.playerScale || 100) / 100})` }}>
            {a.playerShowCover !== false && (a.cover ? <img src={a.cover} alt="" className="rounded-full object-cover" style={{ width: a.playerCoverSize || 36, height: a.playerCoverSize || 36 }} /> : <span className="grid rounded-full bg-white/10" style={{ width: a.playerCoverSize || 36, height: a.playerCoverSize || 36 }} />)}<div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{a.title || "Track title"}</p>{a.playerShowArtist !== false && <p className="truncate text-[11px] opacity-60">{a.artist || "Artist"}</p>}</div><span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Music className="h-3.5 w-3.5" /></span>
            {a.playerShowProgress && <div className="absolute inset-x-2 bottom-1.5"><ProgressPreview audio={a} /></div>}
          </div>
        </div>
        <div className="space-y-5">
          <div><p className="mb-2 text-xs text-muted-foreground">Player treatment</p><ChoiceChips testid="player-effect" value={a.playerEffect || "none"} options={[["none", "Original"], ["glow", "Glow"], ["glass", "Glass"], ["gradient", "Accent wash"], ["scanlines", "Scan lines"]]} onChange={set("playerEffect")} /></div>
          <div className="grid gap-5 md:grid-cols-3">
            <SliderRow testid="player-opacity" label="Panel alpha" value={a.playerOpacity ?? 0.3} min={0} max={1} step={0.01} onChange={set("playerOpacity")} />
            <SliderRow testid="player-scale" label="Player size" value={a.playerScale ?? 100} min={70} max={140} unit="%" onChange={set("playerScale")} />
            <SliderRow testid="player-cover-size" label="Cover size" value={a.playerCoverSize ?? 36} min={24} max={72} unit="px" onChange={set("playerCoverSize")} />
            <SliderRow testid="player-radius" label="Rounding" value={a.playerRadius ?? 12} min={0} max={40} unit="px" onChange={set("playerRadius")} />
            <SliderRow testid="player-blur" label="Glass blur" value={a.playerBlur ?? 0} min={0} max={24} unit="px" onChange={set("playerBlur")} />
          </div>
          <div className="grid gap-3 md:grid-cols-2"><ColorRow testid="player-background" label="Panel" value={a.playerBackground || "#000000"} onChange={set("playerBackground")} /><ColorRow testid="player-text-color" label="Text" value={a.playerTextColor || "#ffffff"} onChange={set("playerTextColor")} /></div>
          <div className="grid gap-3 md:grid-cols-2"><ToggleRow testid="player-show-cover" label="Show cover art" checked={a.playerShowCover !== false} onChange={set("playerShowCover")} /><ToggleRow testid="player-show-artist" label="Show artist" checked={a.playerShowArtist !== false} onChange={set("playerShowArtist")} /><ToggleRow testid="player-show-progress" label="Show progress bar" checked={Boolean(a.playerShowProgress)} onChange={set("playerShowProgress")} /><ToggleRow testid="player-border" label="Show player border" checked={a.playerBorder !== false} onChange={set("playerBorder")} /></div>
          {a.playerShowProgress && <div className="rounded-2xl border border-primary/15 bg-primary/[.035] p-4"><p className="mb-3 text-xs font-semibold">Progress bar</p><div className="grid gap-5 md:grid-cols-2"><div><p className="mb-2 text-xs text-muted-foreground">Shape</p><ChoiceChips testid="player-progress-style" value={a.playerProgressStyle || "rounded"} options={[["line", "Clean line"], ["rounded", "Scrubber"], ["glow", "Soft glow"]]} onChange={set("playerProgressStyle")} /></div><SliderRow testid="player-progress-height" label="Thickness" value={a.playerProgressHeight ?? 4} min={2} max={10} unit="px" onChange={set("playerProgressHeight")} /><ColorRow testid="player-progress-color" label="Progress color" value={a.playerProgressColor || "#a69dd2"} onChange={set("playerProgressColor")} /><ToggleRow testid="player-progress-glow" label="Extra glow" checked={Boolean(a.playerProgressGlow)} onChange={set("playerProgressGlow")} /></div></div>}
        </div>
      </Panel>
      <Panel title="Expanded player" desc="Optional larger player opened from the mini-player." testid="audio-expanded-appearance">
        <ToggleRow testid="expanded-enabled" label="Enable expanded player" checked={Boolean(a.expandedEnabled)} onChange={set("expandedEnabled")} />
        {sideLyricsForceMobile && <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[.06] px-4 py-3 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Forced on for mobile:</strong> your lyrics use the left or right desktop background, so phones open them in this player. The toggle still controls desktop.</div>}
        {!showExpandedSettings && <p className="mt-3 text-xs text-muted-foreground">The mini-player will keep playing music, but its artwork and title will not open a larger view.</p>}
        {showExpandedSettings && <><div className="my-5 rounded-xl bg-[#0b1626] p-5"><ExpandedPreview audio={a} accent={user.profile.card.accent} /></div>
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2"><div><p className="mb-2 text-xs text-muted-foreground">Artwork style</p><ChoiceChips testid="expanded-style" value={a.expandedStyle || "vinyl"} options={[["vinyl", "Vinyl"], ["artwork", "Cover art"], ["minimal", "Minimal"]]} onChange={set("expandedStyle")} /></div><div><p className="mb-2 text-xs text-muted-foreground">Player treatment</p><ChoiceChips testid="expanded-effect" value={a.expandedEffect || "none"} options={[["none", "Clean"], ["glow", "Glow"], ["gradient", "Accent wash"], ["glass", "Glass"]]} onChange={set("expandedEffect")} /></div></div>
          <div className="grid gap-5 md:grid-cols-3"><SliderRow testid="expanded-opacity" label="Panel alpha" value={a.expandedOpacity ?? .98} min={.35} max={1} step={.01} onChange={set("expandedOpacity")} /><SliderRow testid="expanded-width" label="Player width" value={a.expandedWidth ?? 512} min={360} max={680} unit="px" onChange={set("expandedWidth")} /><SliderRow testid="expanded-art-size" label="Artwork size" value={a.expandedArtworkSize ?? 250} min={150} max={330} unit="px" onChange={set("expandedArtworkSize")} /><SliderRow testid="expanded-radius" label="Rounding" value={a.expandedRadius ?? 30} min={0} max={48} unit="px" onChange={set("expandedRadius")} /><SliderRow testid="expanded-blur" label="Glass blur" value={a.expandedBlur ?? 16} min={0} max={30} unit="px" onChange={set("expandedBlur")} /></div>
          <div className="grid gap-3 md:grid-cols-2"><ColorRow testid="expanded-background" label="Panel" value={a.expandedBackground || "#111319"} onChange={set("expandedBackground")} /><ColorRow testid="expanded-text" label="Text" value={a.expandedTextColor || "#ffffff"} onChange={set("expandedTextColor")} /></div>
          <div className="grid gap-3 md:grid-cols-3"><ToggleRow testid="expanded-show-times" label="Show timestamps" checked={a.expandedShowTimes !== false} onChange={set("expandedShowTimes")} /><ToggleRow testid="expanded-show-skip" label="Show skip controls" checked={a.expandedShowSkip !== false} onChange={set("expandedShowSkip")} /><ToggleRow testid="expanded-show-lyrics" label="Show lyrics inside on desktop" checked={a.expandedShowLyrics !== false} onChange={set("expandedShowLyrics")} /></div>
        </div></>}
      </Panel>
      </>}
    </>
  );
}
