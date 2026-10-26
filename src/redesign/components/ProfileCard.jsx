import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, Music2, ChevronDown, MapPin, X, Captions, SkipBack, SkipForward } from "lucide-react";
import { Avatar, BadgeIcon, BackgroundFx, FxText, MediaLayer, OverlayFx, Tip } from "./ProfileBits";
import { DiscordWidget, TikTokWidget, hexA } from "./Widgets";
import PlatformIcon from "./PlatformIcon";
import { BRAND, BADGES } from "../lib/catalog";
import { activeLyricIndex, waitingForLyric } from "../lib/lyrics";
import StreamingPlayer from "./StreamingPlayer";
import ProfileFloatingLayer from "./ProfileFloatingLayer";

const formatTime = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
};

const AudioSeek = ({ audio, value, max, onChange, className = "" }) => {
  const seekable = Number.isFinite(max) && max > 0;
  const safeMax = seekable ? max : 1;
  const progress = Math.max(0, Math.min(100, ((Number(value) || 0) / safeMax) * 100));
  const height = audio.playerProgressHeight ?? 4;
  const color = audio.playerProgressColor || "#6cc4ff";
  const rounded = audio.playerProgressStyle !== "line";
  const glow = audio.playerProgressStyle === "glow" || audio.playerProgressGlow;
  return <label className={`relative block cursor-pointer py-2 ${className}`} style={{ minHeight: Math.max(16, height + 8) }}>
    <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 bg-white/10" style={{ height, borderRadius: rounded ? 999 : 0 }}><span className="absolute inset-y-0 left-0" style={{ width: `${progress}%`, borderRadius: rounded ? 999 : 0, background: color, boxShadow: glow ? `0 0 10px ${color}` : undefined }} />{audio.playerProgressStyle === "rounded" && <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black/60" style={{ left: `${progress}%`, background: color }} />}</span>
    <input aria-label="Seek song" disabled={!seekable} type="range" min="0" max={safeMax} step="0.1" value={Math.min(Number(value) || 0, safeMax)} onChange={(event) => onChange(Number(event.target.value))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
  </label>;
};

const lyricStyle = (audio, index, active, accent) => ({
  color: audio.lyrics?.textEffect === "gradient" && index === active ? "transparent" : index === active ? (audio.lyrics?.activeColor || "#ffffff") : (audio.lyrics?.textColor || "rgba(255,255,255,.38)"),
  fontSize: `${(audio.lyrics?.textSize || 18) * (index === active ? 1.08 : 1) / 16}rem`,
  fontWeight: index === active ? 700 : 500,
  transform: index === active ? "scale(1.02)" : "scale(1)",
  textShadow: audio.lyrics?.textEffect === "glow" && index === active ? `0 0 18px ${accent}` : undefined,
  opacity: audio.lyrics?.textEffect === "fade" && index !== active ? .45 : 1,
  background: audio.lyrics?.textEffect === "gradient" && index === active ? `linear-gradient(90deg, ${audio.lyrics?.activeColor || "#fff"}, ${accent})` : undefined,
  backgroundClip: audio.lyrics?.textEffect === "gradient" && index === active ? "text" : undefined,
});

const LyricWaiting = ({ accent }) => <span data-testid="profile-lyrics-waiting" role="status" aria-label="Waiting for the next lyric" className="inline-flex items-center justify-center gap-2 py-4">
  {[0, 1, 2].map((index) => <span key={index} className="upet-lyric-wait-dot h-2.5 w-2.5 rounded-full" style={{ background: accent, animationDelay: `${index * .18}s` }} />)}
</span>;

const LyricsSheet = ({ audio, currentTime, duration, playing, accent, audioRef, mobile = false, onToggle, onClose }) => {
  const lines = audio.lyrics?.lines || [];
  const active = activeLyricIndex(lines, currentTime);
  const waiting = waitingForLyric(lines, currentTime);
  const playerText = audio.expandedTextColor || "#ffffff";
  const playerBg = audio.expandedBackground || "#111319";
  const playerEffect = audio.expandedEffect || "none";
  const artworkStyle = audio.expandedStyle || "vinyl";
  const showLyrics = Boolean(audio.lyrics?.enabled);
  const lyricsInsideDesktop = audio.expandedShowLyrics !== false && audio.lyrics?.display === "player";
  useEffect(() => {
    const close = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, []);
  const panelStyle = {
    maxWidth: mobile ? "100%" : `${audio.expandedWidth ?? 512}px`,
    borderRadius: `${mobile ? Math.min(audio.expandedRadius ?? 30, 24) : (audio.expandedRadius ?? 30)}px`,
    color: playerText,
    backgroundColor: hexA(playerBg, audio.expandedOpacity ?? .98),
    backgroundImage: playerEffect === "gradient" ? `radial-gradient(circle at 50% 0%, ${hexA(accent, .4)}, transparent 56%)` : undefined,
    backdropFilter: `blur(${(audio.expandedBlur ?? 16) + (playerEffect === "glass" ? 10 : 0)}px)`,
    WebkitBackdropFilter: `blur(${(audio.expandedBlur ?? 16) + (playerEffect === "glass" ? 10 : 0)}px)`,
    boxShadow: playerEffect === "glow" ? `0 0 55px ${hexA(accent, .42)}, 0 28px 80px rgba(0,0,0,.5)` : "0 28px 80px rgba(0,0,0,.5)",
  };
  const artworkSize = mobile ? Math.min(audio.expandedArtworkSize ?? 250, 188) : Math.min(audio.expandedArtworkSize ?? 250, 330);
  const artwork = artworkStyle === "minimal" ? null : <div className={`relative mx-auto mb-4 grid aspect-square max-w-full place-items-center overflow-hidden sm:mb-6 ${artworkStyle === "vinyl" ? "rounded-full border border-white/10 bg-[repeating-radial-gradient(circle,#181a20_0px,#181a20_2px,#0a0b0e_3px,#0a0b0e_6px)]" : "rounded-[20px] border border-white/10 bg-white/5 sm:rounded-[24px]"}`} style={{ width: artworkSize, animation: artworkStyle === "vinyl" && playing ? "upet-vinyl-spin 7s linear infinite" : "none" }}>
    {artworkStyle === "vinyl" && <div className="absolute inset-[22%] rounded-full border border-white/10 bg-[repeating-radial-gradient(circle,#21242a_0px,#21242a_1px,#111319_2px,#111319_4px)]" />}
    <div className={`${artworkStyle === "vinyl" ? "relative z-[1] h-[48%] w-[48%] rounded-full border-[5px] border-[#08090c]" : "h-full w-full"} overflow-hidden bg-white/10 shadow-lg`}>{audio.cover ? <img src={audio.cover} alt={`${audio.title || "Track"} cover art`} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center" style={{ background: `${accent}30` }}><Music2 className="h-9 w-9" style={{ color: accent }} /></div>}</div>
    {artworkStyle === "vinyl" && <span className="absolute h-2 w-2 rounded-full bg-white/70" />}
  </div>;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-end bg-black/80 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-md sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-label={`${audio.title || "Track"} player and lyrics`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="relative max-h-[calc(100svh-24px)] w-full overscroll-contain overflow-y-auto border border-white/15 sm:max-h-[90svh]" style={panelStyle}>
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 px-4 py-3 backdrop-blur sm:p-4" style={{ background: hexA(playerBg, .92) }}>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.22em] opacity-40">Now playing</p><h3 className="truncate font-display text-base font-bold">{audio.title || "Untitled"}</h3><p className="truncate text-xs opacity-55">{audio.artist || "Unknown artist"}</p></div>
          <button type="button" onClick={onClose} aria-label="Close player" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 opacity-70 hover:bg-white/20 hover:opacity-100"><X className="h-4 w-4" /></button>
        </header>
        {mobile && showLyrics && (active >= 0 || waiting) && <div data-testid="profile-mobile-current-lyric" className="sticky top-[65px] z-[9] border-b border-white/10 px-4 py-3 text-center backdrop-blur-xl" style={{ background: hexA(playerBg, .92) }}>
          {waiting ? <LyricWaiting accent={accent} /> : <><p key={lines[active].id} className={`${audio.lyrics?.popout !== false ? 'animate-[upet-lyric-reveal_.48s_cubic-bezier(.2,.8,.2,1)_both]' : ''} break-words text-xl font-bold leading-tight transition-all duration-300`} style={{ ...lyricStyle(audio, active, active, accent), fontSize: `${Math.min(30, Math.max(20, (audio.lyrics?.textSize || 18) * .72))}px` }}>{lines[active].text}</p>
          {lines[active + 1] && <p className="mt-2 truncate text-sm opacity-30">{lines[active + 1].text}</p>}</>}
        </div>}
        <div className="px-4 pb-4 pt-4 sm:px-6 sm:pb-7 sm:pt-6">
          {artwork}
          {artworkStyle === "minimal" && <div className="mx-auto mb-7 h-1 w-20 rounded-full" style={{ background: accent }} />}
          <div className="flex items-center gap-3 text-[11px] opacity-50">{audio.expandedShowTimes !== false && <span>{formatTime(currentTime)}</span>}<AudioSeek audio={audio} value={currentTime} max={duration} onChange={(value) => { if (audioRef.current) audioRef.current.currentTime = value; }} className="min-w-0 flex-1" />{audio.expandedShowTimes !== false && <span>{formatTime(duration)}</span>}</div>
          <div className="mt-2 flex items-center justify-center gap-7 sm:mt-3">{audio.expandedShowSkip !== false && <button type="button" aria-label="Back 10 seconds" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 opacity-70 hover:opacity-100"><SkipBack className="h-5 w-5" /></button>}<button type="button" data-testid="profile-audio-toggle" onClick={onToggle} aria-label={playing ? "Pause" : "Play"} className="grid h-12 w-12 place-items-center rounded-full text-black" style={{ background: accent }}>{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>{audio.expandedShowSkip !== false && <button type="button" aria-label="Forward 10 seconds" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration || currentTime + 10, currentTime + 10); }} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 opacity-70 hover:opacity-100"><SkipForward className="h-5 w-5" /></button>}</div>
          {!mobile && showLyrics && lyricsInsideDesktop && <div className="mt-7 border-t border-white/10 pt-5"><p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[.22em] opacity-40">Lyrics</p><div className="max-h-[30svh] space-y-3 overflow-y-auto px-2" style={{ textAlign: audio.lyrics.alignment || "center" }}>
            {waiting ? <div className="text-center"><LyricWaiting accent={accent} /></div> : lines.map((line, index) => <p key={line.id} className="transition-all duration-300" style={lyricStyle(audio, index, active, accent)}>{line.text}</p>)}
            {!lines.length && <p className="text-center text-sm opacity-45">Lyrics haven’t been added yet.</p>}
          </div></div>}
        </div>
        <div style={{ height: audio.playerProgressHeight ?? 4, background: audio.playerProgressColor || accent, boxShadow: audio.playerProgressGlow ? `0 0 12px ${audio.playerProgressColor || accent}` : undefined }} />
      </section>
    </div>
  );
};

const SideLyrics = ({ audio, currentTime, accent, side, cardWidth = 440 }) => {
  if (!audio.lyrics?.enabled || audio.lyrics.display !== side || !audio.lyrics.lines?.length) return null;
  const lines = audio.lyrics.lines;
  const active = activeLyricIndex(lines, currentTime);
  const waiting = waitingForLyric(lines, currentTime);
  const focus = active;
  if (focus < 0 && !waiting) return null;
  const visible = lines.slice(Math.max(0, focus - 1), Math.min(lines.length, focus + 2));
  const vertical = audio.lyrics.sideVertical || "center";
  const position = vertical === "top" ? "top-[13%]" : vertical === "bottom" ? "bottom-[13%]" : "top-1/2 -translate-y-1/2";
  const activeSize = audio.lyrics.sideTextSize || 56;
  return <aside data-testid="profile-side-lyrics" aria-label="Synced lyrics" className={`upet-side-lyrics pointer-events-none absolute ${side === "left" ? "left-[var(--lyric-inset)]" : "right-[var(--lyric-inset)]"} ${position} z-20`} style={{ "--lyric-width": `${audio.lyrics.sideWidth || 420}px`, "--lyric-inset": `${audio.lyrics.sideInset ?? 4}cqw`, "--profile-half": `${cardWidth / 2}px`, textAlign: audio.lyrics.alignment || (side === "left" ? "right" : "left") }}>
      <div className="space-y-5">{waiting ? <LyricWaiting accent={accent} /> : visible.map((line) => {
        const index = lines.indexOf(line);
        const isFocus = index === focus;
        const isActive = index === active;
        return <p key={`${line.id}-${isActive ? "active" : "inactive"}`} className={`${isActive && audio.lyrics.popout !== false ? "animate-[upet-lyric-reveal_.48s_cubic-bezier(.2,.8,.2,1)_both]" : ""} break-words leading-[1.05] transition-all duration-500`} style={{ ...lyricStyle(audio, index, active, accent), fontSize: `${isFocus ? activeSize : Math.max(16, activeSize * .48)}px`, lineHeight: isFocus ? 1.03 : 1.18, opacity: isActive ? 1 : isFocus ? .5 : .28 }}>{line.text}</p>;
      })}</div>
  </aside>;
};

const AudioBar = ({ audio, accent, cardWidth = 440 }) => {
  const ref = useRef(null);
  const host = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [overlayRoot, setOverlayRoot] = useState(null);
  const [mobileViewport, setMobileViewport] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);
  useEffect(() => { setPopupVisible(Boolean(audio.popupOnLoad && audio.src)); }, [audio.popupOnLoad, audio.src]);
  useEffect(() => { if (ref.current) ref.current.volume = audio.volume ?? 0.6; }, [audio.volume]);
  useLayoutEffect(() => { setOverlayRoot(host.current?.closest("[data-profile-scene]")?.querySelector("[data-profile-overlay-root]") || document.body); }, [audio.sourceType, audio.src]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setMobileViewport(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  if (audio.sourceType === "embed" && audio.embedUrl) return <StreamingPlayer audio={audio} accent={accent} />;
  if (!audio.src) return null;
  const toggle = () => {
    const a = ref.current;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else { a.pause(); setPlaying(false); }
  };
  const placement = audio.playerPlacement || "card";
  const floating = placement !== "card";
  const positionClass = placement === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6";
  const compactButton = placement === "button";
  const mobileSideLyrics = mobileViewport && audio.lyrics?.enabled && ["left", "right"].includes(audio.lyrics?.display);
  const expandedAvailable = Boolean(audio.expandedEnabled) || mobileSideLyrics;
  const openExpanded = () => { if (expandedAvailable) setPlayerOpen(true); };
  const playerEffect = audio.playerEffect || "none";
  const playerOpacity = audio.playerOpacity ?? 0.3;
  const playerStyle = {
    backgroundColor: hexA(audio.playerBackground || "#000000", playerOpacity),
    backgroundImage: playerEffect === "gradient" ? `linear-gradient(135deg, ${hexA(audio.playerBackground || "#000000", playerOpacity)}, ${hexA(accent, playerOpacity)})` : playerEffect === "scanlines" ? `repeating-linear-gradient(0deg, transparent 0 3px, ${hexA("#ffffff", 0.08)} 4px, transparent 5px)` : undefined,
    border: audio.playerBorder === false ? "none" : `1px solid ${hexA("#ffffff", 0.1)}`,
    borderRadius: `${audio.playerRadius ?? 12}px`,
    backdropFilter: `blur(${(audio.playerBlur || 0) + (playerEffect === "glass" ? 12 : 0)}px)`,
    WebkitBackdropFilter: `blur(${(audio.playerBlur || 0) + (playerEffect === "glass" ? 12 : 0)}px)`,
    boxShadow: playerEffect === "glow" ? `0 0 24px ${hexA(accent, 0.45)}` : "0 12px 32px rgba(0,0,0,.24)",
    color: audio.playerTextColor || "#ffffff",
    width: `${audio.playerScale ?? 100}%`,
    maxWidth: "100%",
    transformOrigin: compactButton ? "right center" : "center",
  };
  const coverSize = audio.playerCoverSize ?? 36;
  const playerControls = ({ compact = false, isFloating = false } = {}) => <div className={`relative flex w-full items-center gap-3 overflow-hidden p-2.5 text-left ${audio.playerShowProgress && !compact ? "pb-6" : ""} ${isFloating && compact ? "w-auto rounded-full" : ""}`} style={{ ...playerStyle, width: compact ? "auto" : playerStyle.width }}>
    <button type="button" onClick={openExpanded} disabled={!expandedAvailable} aria-label={expandedAvailable ? "Open music player" : "Expanded player disabled"} data-testid="profile-player-open" data-analytics-feature="Music player" className={`relative shrink-0 ${expandedAvailable ? "cursor-pointer" : "cursor-default"}`}>
      {audio.playerShowCover !== false && audio.cover ? <img src={audio.cover} alt="" className="rounded-full object-cover" style={{ width: compact ? 48 : coverSize, height: compact ? 48 : coverSize }} /> : <span className="grid place-items-center rounded-full border border-white/20" style={{ width: compact ? 48 : coverSize, height: compact ? 48 : coverSize }}><Music2 className="h-4 w-4" style={{ color: audio.playerTextColor || "#ffffff" }} /></span>}
    </button>
    {!compact && <button type="button" onClick={openExpanded} disabled={!expandedAvailable} className={`min-w-0 flex-1 text-left ${expandedAvailable ? "cursor-pointer" : "cursor-default"}`} style={{ color: audio.playerTextColor || "#ffffff" }}><span className="flex items-center gap-1 truncate text-sm font-semibold"><span className="truncate">{audio.title || "Untitled"}</span>{audio.lyrics?.enabled && <Captions className="h-3.5 w-3.5 shrink-0" />}</span>{audio.playerShowArtist !== false && <span className="block truncate text-[11px] opacity-65">{audio.artist}</span>}</button>}
    <button data-testid="profile-audio-toggle" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className={`grid shrink-0 place-items-center rounded-full text-black ${isFloating ? "h-9 w-9" : "h-8 w-8"}`} style={{ background: accent }}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
    {audio.playerShowProgress && !compact && <div data-testid="profile-audio-progress" className="absolute inset-x-3 bottom-0"><AudioSeek audio={audio} value={currentTime} max={duration} onChange={(value) => { if (ref.current) ref.current.currentTime = value; }} className="w-full" /></div>}
  </div>;
  return <>
    <span ref={host} className="hidden" />
    <audio ref={ref} src={audio.src} preload="metadata" loop={audio.loop} autoPlay={audio.autoplay} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={() => setDuration(ref.current?.duration || 0)} onDurationChange={() => setDuration(ref.current?.duration || 0)} onTimeUpdate={() => setCurrentTime(ref.current?.currentTime || 0)} />
    {floating ? <ProfileFloatingLayer root={overlayRoot} side={placement === "left" ? "left" : "right"} compact={compactButton} data-testid="profile-audio"><div className={`flex w-full ${placement === "left" ? "justify-start" : "justify-end"}`}>{playerControls({ compact: compactButton, isFloating: true })}</div></ProfileFloatingLayer> : <div data-testid="profile-audio" className="flex w-full min-w-0 justify-center">{playerControls()}</div>}
    {popupVisible && <ProfileFloatingLayer root={overlayRoot} side={audio.popupSide} top data-testid="profile-audio-popup" style={{ animation: `${audio.popupSide === "right" ? "upet-audio-in-right" : "upet-audio-in-left"} .4s cubic-bezier(.2,.8,.2,1) both` }}><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#111319]/95 p-3 shadow-2xl backdrop-blur-xl"><button type="button" onClick={() => { openExpanded(); setPopupVisible(false); }} disabled={!expandedAvailable} className={`min-w-0 flex-1 text-left ${expandedAvailable ? "cursor-pointer" : "cursor-default"}`}><span className="block truncate text-xs font-semibold text-white">{audio.title || "Untitled"}</span><span className="block truncate text-[11px] text-white/55">{audio.artist || "Now on this profile"}</span></button><button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="grid h-9 w-9 place-items-center rounded-full text-black" style={{ background: accent }}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button><button type="button" aria-label="Dismiss player popup" onClick={() => setPopupVisible(false)} className="text-white/55 hover:text-white"><X className="h-4 w-4" /></button></div></ProfileFloatingLayer>}
    {playerOpen && expandedAvailable && typeof document !== "undefined" && createPortal(<LyricsSheet audio={audio} currentTime={currentTime} duration={duration} playing={playing} accent={accent} audioRef={ref} mobile={mobileViewport} onToggle={toggle} onClose={() => setPlayerOpen(false)} />, document.body)}
    {overlayRoot && createPortal(<><SideLyrics audio={audio} currentTime={currentTime} accent={accent} side="left" cardWidth={cardWidth} /><SideLyrics audio={audio} currentTime={currentTime} accent={accent} side="right" cardWidth={cardWidth} /></>, overlayRoot)}
  </>;
};

const LinkIcon = ({ l, ls, accent }) => {
  const brand = `#${(BRAND[l.platform] || BRAND.website)[0]}`;
  const color = ls.iconColor === "brand" ? brand : ls.iconColor === "accent" ? accent : "#ffffff";
  const glow = ls.glowColor || brand;
  const style = { width: ls.size, height: ls.size, filter: ls.glow ? `drop-shadow(0 0 ${ls.glow * 10}px ${glow}) drop-shadow(0 0 ${ls.glow * 4}px ${glow})` : undefined };
  return <PlatformIcon platform={l.platform} color={color} size={ls.size} style={style} />;
};

const Links = ({ p, compact }) => {
  const ls = p.linkStyle;
  if (!p.links.length) return null;
  if (compact || ls.mode === "icons") return (
    <div className="flex flex-wrap justify-center gap-2">
      {p.links.map((l) => (
        <Tip key={l.id} cfg={p.tooltips} label={l.label}>
          <a href={l.url} target="_blank" rel="noreferrer" data-testid={`profile-link-${l.id}`} data-analytics-feature="Profile links" className="grid place-items-center bg-white/10 transition-transform hover:-translate-y-0.5 hover:bg-white/20" style={{ width: ls.size + 20, height: ls.size + 20, borderRadius: ls.radius }}>
            <LinkIcon l={l} ls={ls} accent={p.card.accent} />
          </a>
        </Tip>
      ))}
    </div>
  );
  return (
    <div className="space-y-2">
      {p.links.map((l) => (
        <a key={l.id} href={l.url} target="_blank" rel="noreferrer" data-testid={`profile-link-${l.id}`} data-analytics-feature="Profile links" className="flex items-center gap-3 border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white transition-colors hover:bg-white/10" style={{ borderRadius: ls.radius }}>
          <LinkIcon l={l} ls={ls} accent={p.card.accent} />
          <span className="flex-1 truncate text-left">{l.label || l.url}</span>
        </a>
      ))}
    </div>
  );
};

const Widgets = ({ widgets }) => (
  <>
    {widgets.discord.enabled && <DiscordWidget cfg={widgets.discord} />}
    {widgets.tiktok.enabled && <TikTokWidget cfg={widgets.tiktok} />}
  </>
);

const Identity = ({ p, align = "center", avatarSize = 104 }) => {
  const shown = (p.shownBadges || []).filter((b) => p.badges.includes(b));
  return (
    <div className={`flex flex-col gap-1 ${align === "center" ? "items-center text-center" : "items-start text-left"}`}>
      <Avatar media={p.media.avatar} name={p.username} size={avatarSize} decoration={p.effects.decoration} hue={p.effects.decoHue} decoSize={p.effects.decoSize} className="mb-2" />
      <h2 className="font-display text-2xl font-extrabold" style={{ color: p.effects.textColor || p.card.textColor }}><FxText fx={p.effects.text} text={p.displayName || p.username} style={{ color: p.effects.textColor || p.card.textColor, '--fx-color': p.effects.textColor || p.card.textColor }} /></h2>
      <div className="text-sm opacity-60" style={{ color: p.card.textColor }}>@{p.username}</div>
      {shown.length > 0 && (
        <div className={`mt-1 flex max-w-full flex-wrap gap-1 ${align === "center" ? "justify-center" : "justify-start"}`} data-testid="profile-badges">
          {shown.map((b) => <Tip key={b} cfg={p.tooltips} label={(BADGES.find((x) => x.id === b) || {}).label}><BadgeIcon id={b} cfg={p.badgeStyle} /></Tip>)}
        </div>
      )}
      {p.bio && <p className="mt-2 max-w-xs text-sm" style={{ color: hexA(p.card.textColor, 0.8) }}>{p.bio}</p>}
      {p.location && <div className="mt-1 flex items-center gap-1 text-xs opacity-60" style={{ color: p.card.textColor }}><MapPin className="h-3 w-3" />{p.location}</div>}
    </div>
  );
};

const shellStyle = (c, scale = 1) => ({
  maxWidth: c.width * scale,
  borderRadius: c.radius,
  background: hexA(c.cardColor, c.alpha),
  backdropFilter: `blur(${c.blur}px)`,
  WebkitBackdropFilter: `blur(${c.blur}px)`,
  border: `1px solid ${hexA(c.accent, c.borderAlpha)}`,
  boxShadow: `0 30px 80px -30px ${hexA(c.accent, 0.5)}`,
});

const Shell = ({ p, children, testid = "profile-card" }) => (
  <div data-testid={testid} className="relative mx-auto w-full p-6" style={shellStyle(p.card)}>
    <div className="relative z-10">{children}</div>
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: p.card.radius }}><OverlayFx kind={p.effects.overlay} /></div>
  </div>
);

const Body = ({ p }) => {
  const { layout, accent } = p.card;
  if (layout === "compact") return (
    <div className="space-y-4">
      <Identity p={{ ...p, bio: "" }} align="left" avatarSize={72} />
      {p.bio && <p className="text-left text-sm" style={{ color: hexA(p.card.textColor, 0.8) }}>{p.bio}</p>}
      <Links p={p} compact />
      <AudioBar audio={p.audio} accent={accent} cardWidth={p.card.width} />
      <Widgets widgets={p.widgets} />
    </div>
  );
  return (
    <div className="space-y-4">
      {layout === "banner" && (
        <div className="-mx-6 -mt-6 mb-[-52px] h-36 isolate overflow-hidden" style={{ borderTopLeftRadius: p.card.radius, borderTopRightRadius: p.card.radius, contain: "paint", clipPath: `inset(0 round ${p.card.radius}px ${p.card.radius}px 0 0)` }}>
          {p.media.banner.src ? <MediaLayer media={p.media.banner} className="h-full w-full" /> : <div className="h-full w-full bg-gradient-to-br from-sky-400/60 to-indigo-500/40" />}
        </div>
      )}
      <Identity p={p} />
      <Links p={p} compact={layout === "minimal" && p.linkStyle.mode !== "list"} />
      <AudioBar audio={p.audio} accent={accent} cardWidth={p.card.width} />
      <Widgets widgets={p.widgets} />
    </div>
  );
};

export const ProfileCard = ({ p }) => <Shell p={p}><Body p={p} /></Shell>;

const DesktopFit = ({ children, enabled = false, allViewports = false, inset = 96 }) => {
  const holder = useRef(null);
  const inner = useRef(null);
  const [fit, setFit] = useState(null);
  useLayoutEffect(() => {
    if (!enabled) { setFit(null); return undefined; }
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scene = holder.current?.closest('[data-profile-scene]');
        const content = inner.current;
        if (!scene || !content || (!allViewports && !window.matchMedia('(min-width: 768px)').matches)) return setFit(null);
        const naturalHeight = content.offsetHeight;
        const availableHeight = Math.max(240, scene.clientHeight - inset);
        const scale = naturalHeight > 0 ? Math.min(1, availableHeight / naturalHeight) : 1;
        setFit((current) => current && Math.abs(current.scale - scale) < .002 && current.height === naturalHeight ? current : { scale, height: naturalHeight });
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (inner.current) observer.observe(inner.current);
    const scene = holder.current?.closest('[data-profile-scene]');
    if (scene) observer.observe(scene);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [allViewports, enabled, inset]);
  const fitted = Boolean(fit && fit.scale < .999);
  return <div ref={holder} data-profile-fit={fitted ? 'scaled' : 'natural'} className="relative my-auto w-full shrink-0" style={fit ? { height: `${fit.height * fit.scale}px` } : undefined}><div ref={inner} className={fit ? 'absolute left-1/2 top-0 w-full' : 'w-full'} style={fit ? { transform: `translateX(-50%) scale(${fit.scale})`, transformOrigin: 'top center' } : undefined}>{children}</div></div>;
};

export const SlideshowPage = ({ p }) => {
  const ref = useRef(null);
  const slides = [
    ["Profile", <Identity p={p} />],
    ["Links", <Links p={p} />],
    ["Now", <div className="space-y-3"><AudioBar audio={p.audio} accent={p.card.accent} cardWidth={p.card.width} /><Widgets widgets={p.widgets} /></div>],
  ].filter(([k], i) => i === 0 || (k === "Links" ? p.links.length : p.audio.src || p.audio.embedUrl || p.widgets.discord.enabled || p.widgets.tiktok.enabled));
  const go = (i) => ref.current?.children[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div ref={ref} data-testid="slideshow-page" className="snap-slides scroll-thin absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-y-contain" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}>
      {slides.map(([label, content], i) => (
        <section key={label} className="relative flex min-h-full snap-start items-center justify-center px-4 py-[max(4.5rem,env(safe-area-inset-top))] sm:px-6">
          <DesktopFit enabled><div className="w-full">
            <div className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-white/50">{String(i + 1).padStart(2, "0")} / {label}</div>
            <Shell p={p} testid={`slide-${i}`}>{content}</Shell>
          </div></DesktopFit>
          {i < slides.length - 1 && <button data-testid={`slideshow-next-${i}`} onClick={() => go(i + 1)} className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-white/70"><ChevronDown className="h-6 w-6" /></button>}
        </section>
      ))}
    </div>
  );
};

export const ProfileScene = ({ p, className = "", children, scrollable = false, fitDesktop = false, fitPreview = false }) => {
  const slideshow = p.card.layout === "slideshow";
  const content = children || (slideshow ? <SlideshowPage p={p} /> : <ProfileCard p={p} />);
  const bg = p.media.background;
  return (
    <div data-profile-scene className={`relative overflow-hidden ${className}`} style={{ background: p.card.bgColor }}>
      {bg.src && <MediaLayer media={bg} className="absolute inset-[-20px] h-[calc(100%+40px)] w-[calc(100%+40px)]" style={{ backgroundSize: "cover" }} />}
      {!bg.src && <div className="absolute inset-0" style={{ background: `radial-gradient(60% 50% at 50% 10%, ${hexA(p.card.accent, 0.35)}, transparent 70%)` }} />}
      <BackgroundFx kind={p.effects.background} amount={p.effects.backgroundAmount} color={p.effects.backgroundColor} />
      {slideshow && !children ? <div className="absolute inset-0 z-10">{content}</div> : scrollable ? <div data-testid="profile-scroll-region" className={`scroll-thin relative z-10 h-full w-full overflow-x-hidden overscroll-y-contain ${fitPreview ? 'overflow-y-hidden' : `overflow-y-auto ${fitDesktop ? 'md:overflow-y-hidden' : ''}`}`} style={{ WebkitOverflowScrolling: "touch", touchAction: fitPreview ? "none" : "pan-y" }}><div className={`flex min-h-full w-full items-start justify-center ${fitPreview ? 'p-3' : 'px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-8'}`}><DesktopFit enabled={fitDesktop || fitPreview} allViewports={fitPreview} inset={fitPreview ? 24 : 96}>{content}</DesktopFit></div></div> : <div className="relative z-10 flex h-full w-full items-center justify-center p-6">{content}</div>}
      <div data-profile-overlay-root className="pointer-events-none absolute inset-0 z-20 overflow-hidden" />
    </div>
  );
};
