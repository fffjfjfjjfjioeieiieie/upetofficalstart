import { useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { iconUrl } from "../lib/catalog";
import { discordBadgeLabels } from "../../shared/discordProfile";

const hexA = (hex, a) => {
  const h = (hex || "#000000").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
export { hexA };

const shell = (w) => ({ background: hexA("#0a1422", w.alpha ?? 0.5), borderRadius: w.radius ?? 16, border: `1px solid ${hexA(w.accent || "#ffffff", 0.35)}` });

export const DiscordWidget = ({ cfg }) => {
  const [copyStatus, setCopyStatus] = useState("");
  const handle = String(cfg.handle || "").replace(/^@/, "").trim();
  const name = cfg.username || handle || "Discord user";
  const userId = /^\d{17,20}$/.test(String(cfg.userId || "")) ? String(cfg.userId) : "";
  const expanded = cfg.layout === "expanded";
  const badges = cfg.showBadges === false ? [] : discordBadgeLabels(cfg.publicFlags);
  const showBanner = cfg.showBanner !== false && Boolean(cfg.banner);
  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied`);
    } catch {
      setCopyStatus(`Could not copy ${label.toLowerCase()}`);
    }
  };
  return (
    <div data-testid="widget-discord" className="isolate w-full min-w-0 overflow-hidden text-left text-white backdrop-blur-md" style={{ ...shell(cfg), boxShadow: `0 14px 36px rgba(0,0,0,.22), 0 0 ${Math.round((cfg.glow || 0) * 32)}px ${hexA(cfg.accent || "#5865f2", (cfg.glow || 0) * .5)}` }}>
      <div className={`relative flex items-start justify-between overflow-hidden px-4 pt-3 ${expanded ? "h-24" : "h-16"}`} style={{ background: showBanner ? `linear-gradient(0deg, rgba(8,11,22,.22), rgba(8,11,22,.22)), url("${cfg.banner}") center / cover` : `radial-gradient(circle at 80% 0%, ${hexA(cfg.accent || "#5865f2", .6)}, transparent 58%), linear-gradient(125deg, #151a32, #22214b)` }}>
        <span className="relative text-[10px] font-bold uppercase tracking-[.2em] text-white/85">Discord profile</span>
        <img src={iconUrl("discord", "ffffff")} alt="" className="relative h-5 w-5 opacity-80" />
      </div>
      <div className="relative px-4 pb-4">
        <div className={`relative -mt-7 grid place-items-center rounded-full border-[3px] border-[#0a1422] bg-[#22284d] shadow-lg ${expanded ? "h-20 w-20" : "h-16 w-16"}`}>
          <span className="absolute inset-0 overflow-hidden rounded-full">{cfg.avatar ? <img src={cfg.avatar} alt={`${name}'s Discord avatar`} className="h-full w-full object-cover" /> : <img src={iconUrl("discord", "ffffff")} alt="" className="m-auto mt-4 h-7 w-7" />}</span>
          {cfg.decoration && <img src={cfg.decoration} alt="Discord avatar decoration" className="pointer-events-none absolute -inset-[13%] h-[126%] w-[126%] max-w-none object-contain" />}
        </div>
        <div className="mt-2 min-w-0"><div className="flex min-w-0 items-center gap-2"><div className="min-w-0 truncate font-display text-lg font-bold">{name}</div>{cfg.guildTag && <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold" title="Discord primary guild tag">{cfg.guildBadge && <img src={cfg.guildBadge} alt="" className="h-3.5 w-3.5" />}{cfg.guildTag}</span>}</div><div className="truncate text-sm text-white/60">{handle ? `@${handle}` : "Discord account connected"}</div></div>
        {badges.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Discord public badges">{badges.map((badge) => <span key={badge} className="rounded-full border border-white/10 bg-white/[.07] px-2 py-0.5 text-[10px] font-medium text-white/75">{badge}</span>)}</div>}
        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
          {userId ? <a href={`https://discord.com/users/${userId}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${handle || name}'s Discord profile to add them as a friend`} className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition hover:brightness-110" style={{ background: cfg.accent || "#5865f2" }}><UserPlus className="h-4 w-4 shrink-0" />Add Friend</a> : <span className="flex-1 text-xs text-white/55">Reconnect Discord to open this profile.</span>}
          {handle && <button type="button" onClick={() => copy(handle, "Username")} aria-label="Copy Discord username" title="Copy username" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/[.07] transition hover:bg-white/15"><Copy className="h-4 w-4" /></button>}
          {userId && <button type="button" onClick={() => copy(userId, "User ID")} aria-label="Copy Discord user ID" title="Copy user ID" className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border border-white/15 bg-white/[.07] px-2.5 text-[11px] font-semibold transition hover:bg-white/15">ID <Copy className="h-3.5 w-3.5" /></button>}
        </div>
        {copyStatus && <p role="status" className="mt-2 text-xs leading-relaxed text-white/65">{copyStatus}</p>}
      </div>
    </div>
  );
};

const tiktokVideoId = (url = "") => (url.match(/video\/(\d+)/) || [])[1];

export const TikTokWidget = ({ cfg }) => {
  const vid = tiktokVideoId(cfg.videoUrl);
  const handle = (cfg.username || "").replace("@", "");
  return (
    <div data-testid="widget-tiktok" className="overflow-hidden text-left backdrop-blur-md" style={shell(cfg)}>
      <div className="flex items-center gap-3 p-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-black"><img src={iconUrl("tiktok", "ffffff")} alt="" className="h-5 w-5" style={{ filter: `drop-shadow(1px 1px 0 #fe2c55) drop-shadow(-1px -1px 0 ${cfg.accent})` }} /></div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">@{handle || "username"}</div>
          <div className="text-xs text-white/60">TikTok</div>
        </div>
        <a href={`https://www.tiktok.com/@${handle}`} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ background: cfg.accent }}>Follow</a>
      </div>
      {vid && <iframe title="tiktok" src={`https://www.tiktok.com/embed/v2/${vid}`} className="h-[480px] w-full border-0" allow="encrypted-media" />}
    </div>
  );
};
