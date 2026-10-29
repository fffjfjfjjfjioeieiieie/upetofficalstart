import { useEffect, useRef, useState } from "react";
import { BADGES } from "../lib/catalog";
import { ShieldCheck, Crown, Star, Sparkles, Zap, Bug, Heart, ShoppingBag, Award } from "lucide-react";

export const mediaStyle = (m) => ({
  backgroundImage: m && m.src ? `url(${m.src})` : undefined,
  backgroundSize: `${(m?.zoom || 1) * 100}%`,
  backgroundPosition: `${m?.x ?? 50}% ${m?.y ?? 50}%`,
  backgroundRepeat: "no-repeat",
  filter: m?.blur ? `blur(${m.blur}px)` : undefined,
  transform: m?.rotate ? `rotate(${m.rotate}deg)` : undefined,
});

export const isVideoMedia = (m) => m?.type === "video" || String(m?.type || "").startsWith("video/") || /\.(mp4|webm|mov)(?:$|[?#])/i.test(String(m?.src || ""));

export const MediaLayer = ({ media, className = "", style = {} }) => {
  if (!media?.src) return null;
  if (isVideoMedia(media)) return <video src={media.src} className={className} style={{ objectFit: "cover", objectPosition: `${media.x ?? 50}% ${media.y ?? 50}%`, filter: media.blur ? `blur(${media.blur}px)` : undefined, transform: `scale(${(media.zoom || 1) * (media.size || 100) / 100}) rotate(${media.rotate || 0}deg)`, ...style }} autoPlay loop muted playsInline preload="metadata" />;
  return <div className={className} style={{ ...mediaStyle(media), ...style }} />;
};

export const Avatar = ({ media, name = "", size = 96, decoration, hue = 0, decoSize = 120, className = "" }) => {
  const s = Math.round(size * ((media?.size ?? 100) / 100));
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: s, height: s }}>
      <div className="h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-violet-300 to-violet-700">
        {media?.src ? (
          <MediaLayer media={media} className="h-full w-full" style={isVideoMedia(media) ? { transform: `scale(${media.zoom || 1}) rotate(${media.rotate || 0}deg)` } : { backgroundSize: `${(media.zoom || 1) * 100}%` }} />
        ) : (
          <div className="grid h-full w-full place-items-center font-display font-bold text-white" style={{ fontSize: s * 0.38 }}>{(name[0] || "?").toUpperCase()}</div>
        )}
      </div>
      {decoration && (
        <img src={decoration.url} alt="" className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" style={{ width: `${decoSize}%`, filter: hue ? `hue-rotate(${hue}deg)` : undefined }} />
      )}
    </div>
  );
};

const BADGE_ICON = { founder: Crown, staff: ShieldCheck, verified: Sparkles, premium: Award, og: Star, booster: Zap, bughunter: Bug, donor: Heart, seller: ShoppingBag };

const alphaHex = (a) => Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0");

export const BadgeIcon = ({ id, size = 18, cfg }) => {
  const b = BADGES.find((x) => x.id === id);
  const Icon = BADGE_ICON[id] || Star;
  if (!b) return null;
  const st = cfg || { style: "soft", bgAlpha: 0.15, glow: 0, monochrome: false };
  const color = st.monochrome ? st.color : b.color;
  const s = cfg ? cfg.size : size;
  const isSoft = st.style === "soft";
  const isSolid = st.style === "solid";
  const isOutline = st.style === "outline";
  const background = isSolid ? color : isSoft ? `${color}${alphaHex(st.bgAlpha)}` : "transparent";
  const glow = Math.max(0, Number(st.glow) || 0);
  return (
    <span
      data-testid={`badge-${id}`}
      className="inline-grid place-items-center rounded-full transition-[width,height,background-color,border-color,filter,box-shadow] duration-150"
      style={{
        width: s + 10,
        height: s + 10,
        background,
        border: isOutline ? `1.5px solid ${color}` : "1.5px solid transparent",
        color: isSolid ? "#08111f" : color,
        filter: glow ? `drop-shadow(0 0 ${Math.max(1, glow * 0.55)}px ${color})` : undefined,
        boxShadow: glow ? `0 0 ${glow}px ${color}, inset 0 0 ${glow * 0.35}px ${color}` : undefined,
      }}
    >
      <Icon style={{ width: s, height: s }} />
    </span>
  );
};

const Typewriter = ({ text }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((v) => (v >= text.length + 8 ? 0 : v + 1)), 120);
    return () => clearInterval(t);
  }, [text]);
  return <span className="fx-caret">{text.slice(0, Math.min(n, text.length))}</span>;
};

const SPLIT = ["wave", "bounce", "blurin"];
const GLYPHS = "!<>-_\\/[]{}=+*^?#ABCDEFabcdef0123456789";

const Scramble = ({ text }) => {
  const [out, setOut] = useState(text);
  useEffect(() => {
    let f = 0;
    const t = setInterval(() => {
      f = (f + 1) % (text.length * 3 + 30);
      const k = Math.floor(f / 3);
      setOut(text.split("").map((c, i) => (i < k || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
    }, 45);
    return () => clearInterval(t);
  }, [text]);
  return <span className="font-mono">{out}</span>;
};

export const FxText = ({ fx, text, className = "", style }) => {
  if (fx === "glitch") return <span className={`fx-glitch ${className}`} style={style} data-text={text}>{text}</span>;
  if (fx === "typewriter") return <span className={className} style={style}><Typewriter text={text} /></span>;
  if (fx === "scramble") return <span className={className} style={style}><Scramble text={text} /></span>;
  if (SPLIT.includes(fx)) return <span className={`fx-${fx} ${className}`} style={style}>{text.split("").map((c, i) => <span key={i} className="fx-l" style={{ "--i": i }}>{c}</span>)}</span>;
  if (fx && fx !== "none") return <span className={`fx-${fx} ${className}`} style={style}>{text}</span>;
  return <span className={className} style={style}>{text}</span>;
};

export const Tip = ({ cfg, label, children }) => {
  if (!cfg || !cfg.enabled || !label) return children;
  const bg = cfg.style === "minimal" ? "transparent" : cfg.style === "solid" ? cfg.color : `${cfg.color}cc`;
  const pos = cfg.position === "bottom" ? { top: "calc(100% + 6px)" } : { bottom: "calc(100% + 6px)" };
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="tip rounded-lg font-medium" style={{ ...pos, background: bg, color: cfg.textColor, backdropFilter: cfg.style === "glass" ? "blur(8px)" : undefined, border: cfg.style === "minimal" ? "none" : "1px solid rgba(255,255,255,.12)" }}>{label}</span>
    </span>
  );
};

const useCanvasFx = (kind, amount, color) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !["rain", "snow", "thunder"].includes(kind)) return;
    const ctx = c.getContext("2d");
    let raf;
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize();
    const strength = Math.max(0, Math.min(1, Number(amount) / 100));
    const available = Math.round((c.width * c.height) / (kind === "snow" ? 5000 : 3000));
    const count = Math.min(Math.round(available * strength), 400);
    const parts = Array.from({ length: Math.min(count, 400) }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, v: kind === "snow" ? 0.4 + Math.random() : 6 + Math.random() * 6, r: 1 + Math.random() * 2.2, d: Math.random() * Math.PI * 2 }));
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1;
      for (const p of parts) {
        if (kind === "snow") {
          p.d += 0.01;
          p.x += Math.sin(p.d) * 0.4;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 1.5, p.y + p.v * 2); ctx.stroke();
        }
        p.y += p.v;
        if (p.y > c.height) { p.y = -10; p.x = Math.random() * c.width; }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [kind, amount, color]);
  return ref;
};

export const BackgroundFx = ({ kind, amount = 50, color = "#ffffff" }) => {
  const strength = Math.max(0, Math.min(1, Number(amount) / 100));
  const ref = useCanvasFx(kind, amount, color);
  if (!kind || kind === "none") return null;
  const particleCount = strength === 0 ? 0 : Math.max(3, Math.round(42 * strength));
  const particles = Array.from({ length: particleCount }, (_, index) => index);
  const stars = Array.from({ length: strength === 0 ? 0 : Math.max(5, Math.round(72 * strength)) }, (_, index) => index);
  const columns = Array.from({ length: strength === 0 ? 0 : Math.max(3, Math.round(18 * strength)) }, (_, index) => index);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ color, opacity: strength === 0 ? 0 : .35 + strength * .65, "--fx-color": color, "--fx-strength": strength }}>
      {kind === "spotlight" && <div className="absolute inset-0 float-y" style={{ opacity: strength, background: "radial-gradient(40% 55% at 50% 0%, color-mix(in srgb, currentColor 55%, transparent), transparent 70%)" }} />}
      {["rain", "snow", "thunder"].includes(kind) && <canvas ref={ref} className="absolute inset-0 h-full w-full" />}
      {kind === "thunder" && <div className="bg-thunder-flash absolute inset-0" style={{ opacity: strength, backgroundColor: color }} />}
      {kind === "aurora" && <div className="bg-fx-aurora absolute -inset-[25%]" style={{ opacity: .25 + strength * .75 }} />}
      {kind === "stars" && <div className="bg-fx-stars absolute inset-0">{stars.map((index) => <i key={index} style={{ "--x": `${(index * 47 + 13) % 98}%`, "--y": `${(index * 67 + 7) % 96}%`, "--size": `${2 + (index % 5) * 1.15}px`, "--delay": `${-((index * .37) % 4.5)}s`, "--duration": `${1.6 + (index % 6) * .42}s` }} />)}</div>}
      {["fireflies", "bubbles", "embers", "sakura"].includes(kind) && <div className={`bg-fx-particles bg-fx-${kind} absolute inset-0`}>{particles.map((index) => <i key={index} style={{ "--i": index, "--x": `${(index * 37 + 11) % 96}%`, "--delay": `${-((index * 0.47) % 7)}s`, "--duration": `${5 + (index % 6) * 0.7}s`, "--size": `${7 + (index % 4) * 4}px`, "--drift": `${(index % 3 - 1) * 24}px` }} />)}</div>}
      {kind === "hearts" && <div className="bg-fx-particles bg-fx-hearts absolute inset-0">{particles.slice(0, Math.max(3, Math.round(particleCount * .7))).map((index) => <i key={index} style={{ "--i": index, "--x": `${(index * 41 + 7) % 94}%`, "--delay": `${-((index * 0.61) % 8)}s`, "--duration": `${6 + (index % 5) * 0.8}s`, "--font-size": `${8 + (index % 4) * 3}px`, "--drift": `${(index % 3 - 1) * 24}px` }}>♥</i>)}</div>}
      {kind === "matrix" && <div className="bg-fx-matrix absolute inset-0">{columns.map((index) => <span key={index} style={{ "--i": index, "--delay": `${-(index % 5) * 0.7}s` }}>01<br />10<br />11<br />00<br />10<br />01</span>)}</div>}
    </div>
  );
};

export const OverlayFx = ({ kind }) => {
  if (!kind || kind === "none") return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 30 }}>
      <div className={`absolute ${kind === "grain" ? "" : "inset-0"} ov-${kind}`} />
    </div>
  );
};
