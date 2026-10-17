import { useEffect, useRef, useState } from "react";
import { Play, Pause, Music2, ChevronDown, Globe, MapPin } from "lucide-react";
import { Avatar, BadgeIcon, BackgroundFx, FxText, MediaLayer, OverlayFx, Tip } from "./ProfileBits";
import { DiscordWidget, TikTokWidget, hexA } from "./Widgets";
import { iconUrl, BRAND, BADGES } from "../lib/catalog";

const AudioBar = ({ audio, accent }) => {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (ref.current) ref.current.volume = audio.volume ?? 0.6; }, [audio.volume]);
  if (!audio.src) return null;
  const toggle = () => {
    const a = ref.current;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else { a.pause(); setPlaying(false); }
  };
  return (
    <div data-testid="profile-audio" className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2.5 text-left">
      <audio ref={ref} src={audio.src} loop={audio.loop} autoPlay={audio.autoplay} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      {audio.cover ? <img src={audio.cover} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="grid h-9 w-9 place-items-center rounded-full border border-white/20"><Music2 className="h-4 w-4 text-white/80" /></div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{audio.title || "Untitled"}</div>
        <div className="truncate text-[11px] text-white/55">{audio.artist}</div>
      </div>
      <button data-testid="profile-audio-toggle" onClick={toggle} className="grid h-8 w-8 place-items-center rounded-full text-black" style={{ background: accent }}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
    </div>
  );
};

const LinkIcon = ({ l, ls, accent }) => {
  const brand = `#${(BRAND[l.platform] || BRAND.website)[0]}`;
  const color = ls.iconColor === "brand" ? brand : ls.iconColor === "accent" ? accent : "#ffffff";
  const glow = ls.glowColor || brand;
  const style = { width: ls.size, height: ls.size, filter: ls.glow ? `drop-shadow(0 0 ${ls.glow * 10}px ${glow}) drop-shadow(0 0 ${ls.glow * 4}px ${glow})` : undefined };
  return iconUrl(l.platform) ? <img src={iconUrl(l.platform, color)} alt="" style={style} /> : <Globe style={{ ...style, color }} />;
};

const Links = ({ p, compact }) => {
  const ls = p.linkStyle;
  if (!p.links.length) return null;
  if (compact || ls.mode === "icons") return (
    <div className="flex flex-wrap justify-center gap-2">
      {p.links.map((l) => (
        <Tip key={l.id} cfg={p.tooltips} label={l.label}>
          <a href={l.url} target="_blank" rel="noreferrer" data-testid={`profile-link-${l.id}`} className="grid place-items-center bg-white/10 transition-transform hover:-translate-y-0.5 hover:bg-white/20" style={{ width: ls.size + 20, height: ls.size + 20, borderRadius: ls.radius }}>
            <LinkIcon l={l} ls={ls} accent={p.card.accent} />
          </a>
        </Tip>
      ))}
    </div>
  );
  return (
    <div className="space-y-2">
      {p.links.map((l) => (
        <a key={l.id} href={l.url} target="_blank" rel="noreferrer" data-testid={`profile-link-${l.id}`} className="flex items-center gap-3 border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white transition-colors hover:bg-white/10" style={{ borderRadius: ls.radius }}>
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
      <h2 className="font-display text-2xl font-extrabold" style={{ color: p.card.textColor }}><FxText fx={p.effects.text} text={p.displayName || p.username} /></h2>
      <div className="text-sm opacity-60" style={{ color: p.card.textColor }}>@{p.username}</div>
      {shown.length > 0 && (
        <div className="mt-1 flex gap-1" data-testid="profile-badges">
          {shown.map((b) => <Tip key={b} cfg={p.tooltips} label={(BADGES.find((x) => x.id === b) || {}).label}><BadgeIcon id={b} cfg={p.badgeStyle} /></Tip>)}
        </div>
      )}
      {p.bio && <p className="mt-2 max-w-xs text-sm" style={{ color: hexA(p.card.textColor, 0.8) }}>{p.bio}</p>}
      {p.location && <div className="mt-1 flex items-center gap-1 text-xs opacity-60" style={{ color: p.card.textColor }}><MapPin className="h-3 w-3" />{p.location}</div>}
    </div>
  );
};

const shellStyle = (c, scale = 1) => ({ maxWidth: c.width * scale, borderRadius: c.radius, background: hexA(c.cardColor, c.alpha), backdropFilter: `blur(${c.blur}px)`, WebkitBackdropFilter: `blur(${c.blur}px)`, border: `1px solid ${hexA(c.accent, c.borderAlpha)}`, boxShadow: `0 30px 80px -30px ${hexA(c.accent, 0.5)}` });

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
      <AudioBar audio={p.audio} accent={accent} />
      <Widgets widgets={p.widgets} />
    </div>
  );
  return (
    <div className="space-y-4">
      {layout === "banner" && (
        <div className="-mx-6 -mt-6 mb-[-52px] h-36 overflow-hidden" style={{ borderTopLeftRadius: p.card.radius, borderTopRightRadius: p.card.radius }}>
          {p.media.banner.src ? <MediaLayer media={p.media.banner} className="h-full w-full" /> : <div className="h-full w-full bg-gradient-to-br from-sky-400/60 to-indigo-500/40" />}
        </div>
      )}
      <Identity p={p} />
      <Links p={p} compact={layout === "minimal" && p.linkStyle.mode !== "list"} />
      <AudioBar audio={p.audio} accent={accent} />
      <Widgets widgets={p.widgets} />
    </div>
  );
};

export const ProfileCard = ({ p }) => <Shell p={p}><Body p={p} /></Shell>;

export const SlideshowPage = ({ p }) => {
  const ref = useRef(null);
  const slides = [
    ["Profile", <Identity p={p} />],
    ["Links", <Links p={p} />],
    ["Now", <div className="space-y-3"><AudioBar audio={p.audio} accent={p.card.accent} /><Widgets widgets={p.widgets} /></div>],
  ].filter(([k], i) => i === 0 || (k === "Links" ? p.links.length : p.audio.src || p.widgets.discord.enabled || p.widgets.tiktok.enabled));
  const go = (i) => ref.current.scrollTo({ top: i * ref.current.clientHeight, behavior: "smooth" });
  return (
    <div ref={ref} data-testid="slideshow-page" className="snap-slides scroll-thin absolute inset-0 overflow-y-auto">
      {slides.map(([label, content], i) => (
        <section key={label} className="relative flex h-full min-h-full items-center justify-center p-6">
          <div className="w-full">
            <div className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-white/50">{String(i + 1).padStart(2, "0")} / {label}</div>
            <Shell p={p} testid={`slide-${i}`}>{content}</Shell>
          </div>
          {i < slides.length - 1 && <button data-testid={`slideshow-next-${i}`} onClick={() => go(i + 1)} className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-white/70"><ChevronDown className="h-6 w-6" /></button>}
        </section>
      ))}
    </div>
  );
};

export const ProfileScene = ({ p, className = "", children }) => {
  const slideshow = p.card.layout === "slideshow";
  const content = children || (slideshow ? <SlideshowPage p={p} /> : <ProfileCard p={p} />);
  const bg = p.media.background;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: p.card.bgColor }}>
      {bg.src && <MediaLayer media={bg} className="absolute inset-[-20px] h-[calc(100%+40px)] w-[calc(100%+40px)]" style={{ backgroundSize: "cover" }} />}
      {!bg.src && <div className="absolute inset-0" style={{ background: `radial-gradient(60% 50% at 50% 10%, ${hexA(p.card.accent, 0.35)}, transparent 70%)` }} />}
      <BackgroundFx kind={p.effects.background} />
      {slideshow && !children ? <div className="absolute inset-0 z-10">{content}</div> : <div className="relative z-10 flex h-full w-full items-center justify-center p-6">{content}</div>}
    </div>
  );
};
