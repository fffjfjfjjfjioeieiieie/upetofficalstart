import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Music2, ChevronDown, Globe, MapPin, X, Captions, Store, ShoppingBag, MessageCircle } from "lucide-react";
import { Avatar, BadgeIcon, BackgroundFx, FxText, MediaLayer, OverlayFx, Tip } from "./ProfileBits";
import { DiscordWidget, TikTokWidget, hexA } from "./Widgets";
import { iconUrl, BRAND, BADGES } from "../lib/catalog";
import { sendShopMessage } from "../lib/messageStore";

const formatTime = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
};

const LyricsSheet = ({ audio, currentTime, accent, onClose }) => {
  const lines = [...(audio.lyrics?.lines || [])].sort((a, b) => a.time - b.time);
  const active = lines.reduce((found, line, index) => line.time <= currentTime ? index : found, -1);
  useEffect(() => {
    const close = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-black/70 p-3 backdrop-blur-md sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`${audio.title || "Track"} lyrics`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-[#111319]/95 shadow-2xl">
        <header className="flex items-center gap-3 border-b border-white/10 p-4">
          {audio.cover ? <img src={audio.cover} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10"><Music2 className="h-5 w-5" /></div>}
          <div className="min-w-0 flex-1"><h3 className="truncate font-display text-base font-bold text-white">{audio.title || "Untitled"}</h3><p className="truncate text-xs text-white/55">{audio.artist || "Unknown artist"} · {formatTime(currentTime)}</p></div>
          <button type="button" onClick={onClose} aria-label="Close lyrics" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"><X className="h-4 w-4" /></button>
        </header>
        <div className="max-h-[62svh] space-y-3 overflow-y-auto px-6 py-8 text-center">
          {lines.map((line, index) => <p key={line.id} className="transition-all duration-300" style={{ color: index === active ? "#fff" : "rgba(255,255,255,.35)", fontSize: index === active ? "1.35rem" : "1.05rem", fontWeight: index === active ? 700 : 500, transform: index === active ? "scale(1.02)" : "scale(1)" }}>{line.text}</p>)}
        </div>
        <div className="h-1" style={{ background: accent }} />
      </section>
    </div>
  );
};

const StorefrontSheet = ({ profile, onClose }) => {
  const [message, setMessage] = useState("");
  const [compose, setCompose] = useState(false);
  const shop = profile.shop;
  const money = (price) => price ? new Intl.NumberFormat(undefined, { style: "currency", currency: shop.currency || "GBP" }).format(Number(price)) : "Price on request";
  useEffect(() => {
    const close = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-black/75 p-3 backdrop-blur-md sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`${shop.name || profile.username} shop`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/15 bg-[#111319]/95 shadow-2xl">
        <header className="flex items-center gap-3 border-b border-white/10 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${profile.card.accent}25`, color: profile.card.accent }}><Store className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1"><p className="text-xs font-medium uppercase tracking-[.2em] text-white/45">{profile.displayName}'s shop</p><h3 className="truncate font-display text-xl font-bold text-white">{shop.name || `${profile.username}'s shop`}</h3></div>
          <button type="button" onClick={onClose} aria-label="Close shop" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"><X className="h-4 w-4" /></button>
        </header>
        <div className="max-h-[68svh] overflow-y-auto p-5"><p className="mb-5 text-sm text-white/60">{shop.description || "A little collection from this profile."}</p>
          {message && <div role="status" className="mb-4 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</div>}
          <div className="grid gap-4 sm:grid-cols-2">{shop.products.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.035]">
            <div className="relative aspect-[16/9] bg-black/20">{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <Store className="absolute inset-0 m-auto h-7 w-7 text-white/35" />}</div>
            <div className="p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-semibold text-white">{product.name}</h4><p className="mt-1 text-xs capitalize text-white/50">{product.type || "digital"}{product.stock ? ` · ${product.stock} left` : ""}</p></div><strong className="shrink-0 text-sm" style={{ color: profile.card.accent }}>{money(product.price)}</strong></div>
            {product.description && <p className="mt-3 text-sm text-white/60">{product.description}</p>}
            <button type="button" data-testid={`shop-buy-${product.id}`} onClick={() => setMessage(`Checkout for ${product.name} is coming soon.`)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-black" style={{ background: profile.card.accent }}><ShoppingBag className="h-4 w-4" />Buy {product.name}</button></div>
          </article>)}</div>
          {!shop.products.length && <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">This shop is being stocked.</div>}
        </div>
        <footer className="flex flex-wrap gap-2 border-t border-white/10 p-4"><button type="button" data-testid="shop-contact" onClick={() => setCompose(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/15"><MessageCircle className="h-4 w-4" />Message seller</button>{shop.contactUrl && <a href={shop.contactUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-xl border border-white/15 px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">Contact link</a>}</footer>
      </section>
      {compose && <MessageSellerSheet ownerUsername={profile.username} shopName={shop.name || `${profile.username}'s shop`} onClose={() => setCompose(false)} />}
    </div>
  );
};

const MessageSellerSheet = ({ ownerUsername, shopName, onClose }) => {
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState("idle");
  const submit = async (event) => {
    event.preventDefault();
    setState("sending");
    try { await sendShopMessage(ownerUsername, { senderName, senderContact, body }); setState("sent"); }
    catch (error) { setState(error?.message || "Message could not be sent."); }
  };
  return <div className="fixed inset-0 z-[80] grid place-items-end bg-black/70 p-3 backdrop-blur-md sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Message ${shopName}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form onSubmit={submit} className="w-full max-w-md rounded-[28px] border border-white/15 bg-[#111319] p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[.2em] text-primary">Shop messages</p><h3 className="mt-1 font-display text-xl font-bold text-white">Message {shopName}</h3></div><button type="button" onClick={onClose} aria-label="Close message form" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"><X className="h-4 w-4" /></button></div>{state === "sent" ? <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-primary">Your message was sent. The seller can reply using the contact details you provided.</div> : <><div className="mt-5 grid gap-3"><input required value={senderName} onChange={(event) => setSenderName(event.target.value)} placeholder="Your name" className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-primary" /><input value={senderContact} onChange={(event) => setSenderContact(event.target.value)} placeholder="Email, Discord, or another way to reply (optional)" className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-primary" /><textarea required rows={5} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your message…" className="resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-primary" /></div>{state !== "idle" && state !== "sending" && <p className="mt-3 text-xs text-red-300">{state}</p>}<button disabled={state === "sending"} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><MessageCircle className="h-4 w-4" />{state === "sending" ? "Sending…" : "Send message"}</button></>}</form></div>;
};

const ShopButton = ({ p }) => {
  if (!p.shop?.enabled) return null;
  return <Link to={`/${p.username}/shop`} data-testid="profile-shop-open" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"><Store className="h-4 w-4" style={{ color: p.card.accent }} />Visit {p.shop.name || "shop"}</Link>;
};

const AudioBar = ({ audio, accent }) => {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  useEffect(() => { if (ref.current) ref.current.volume = audio.volume ?? 0.6; }, [audio.volume]);
  if (!audio.src) return null;
  const toggle = () => {
    const a = ref.current;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else { a.pause(); setPlaying(false); }
  };
  return (
    <div data-testid="profile-audio" className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2.5 text-left">
      <audio ref={ref} src={audio.src} loop={audio.loop} autoPlay={audio.autoplay} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={() => setCurrentTime(ref.current?.currentTime || 0)} />
      {audio.cover ? <img src={audio.cover} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="grid h-9 w-9 place-items-center rounded-full border border-white/20"><Music2 className="h-4 w-4 text-white/80" /></div>}
      <div className="min-w-0 flex-1">
        {audio.lyrics?.enabled && audio.lyrics.lines?.length ? <button type="button" data-testid="profile-lyrics-open" onClick={() => setLyricsOpen(true)} className="flex max-w-full items-center gap-1 truncate text-sm font-semibold text-white hover:text-primary"><span className="truncate">{audio.title || "Untitled"}</span><Captions className="h-3.5 w-3.5 shrink-0" /></button> : <div className="truncate text-sm font-semibold text-white">{audio.title || "Untitled"}</div>}
        <div className="truncate text-[11px] text-white/55">{audio.artist}</div>
      </div>
      <button data-testid="profile-audio-toggle" onClick={toggle} className="grid h-8 w-8 place-items-center rounded-full text-black" style={{ background: accent }}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
      {lyricsOpen && <LyricsSheet audio={audio} currentTime={currentTime} accent={accent} onClose={() => setLyricsOpen(false)} />}
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
      <ShopButton p={p} />
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
      <ShopButton p={p} />
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
    ["Shop", <ShopButton p={p} />],
    ["Now", <div className="space-y-3"><AudioBar audio={p.audio} accent={p.card.accent} /><Widgets widgets={p.widgets} /></div>],
  ].filter(([k], i) => i === 0 || (k === "Links" ? p.links.length : k === "Shop" ? p.shop?.enabled : p.audio.src || p.widgets.discord.enabled || p.widgets.tiktok.enabled));
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

export const ProfileScene = ({ p, className = "", children, scrollable = false }) => {
  const slideshow = p.card.layout === "slideshow";
  const content = children || (slideshow ? <SlideshowPage p={p} /> : <ProfileCard p={p} />);
  const bg = p.media.background;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: p.card.bgColor }}>
      {bg.src && <MediaLayer media={bg} className="absolute inset-[-20px] h-[calc(100%+40px)] w-[calc(100%+40px)]" style={{ backgroundSize: "cover" }} />}
      {!bg.src && <div className="absolute inset-0" style={{ background: `radial-gradient(60% 50% at 50% 10%, ${hexA(p.card.accent, 0.35)}, transparent 70%)` }} />}
      <BackgroundFx kind={p.effects.background} />
      {slideshow && !children ? <div className="absolute inset-0 z-10">{content}</div> : scrollable ? <div className="scroll-thin relative z-10 h-full w-full overflow-y-auto"><div className="flex min-h-full w-full items-center justify-center p-6">{content}</div></div> : <div className="relative z-10 flex h-full w-full items-center justify-center p-6">{content}</div>}
    </div>
  );
};
