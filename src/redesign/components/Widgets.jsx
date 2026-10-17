import { useEffect, useState } from "react";
import { iconUrl } from "../lib/catalog";

const STATUS = { online: "#3ba55d", idle: "#faa81a", dnd: "#ed4245", offline: "#747f8d" };

const hexA = (hex, a) => {
  const h = (hex || "#000000").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
export { hexA };

const shell = (w) => ({ background: hexA("#0a1422", w.alpha ?? 0.5), borderRadius: w.radius ?? 16, border: `1px solid ${hexA(w.accent || "#ffffff", 0.35)}` });

export const DiscordWidget = ({ cfg }) => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!cfg.userId) return;
    let alive = true;
    setErr("");
    fetch(`https://api.lanyard.rest/v1/users/${cfg.userId}`)
      .then((r) => r.json())
      .then((j) => alive && (j.success ? setData(j.data) : setErr("Join discord.gg/lanyard to enable presence")))
      .catch(() => alive && setErr("Presence unavailable"));
    return () => { alive = false; };
  }, [cfg.userId]);
  const u = data?.discord_user;
  const act = data?.activities?.find((a) => a.type !== 4);
  const custom = data?.activities?.find((a) => a.type === 4);
  const avatar = u?.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith("a_") ? "gif" : "png"}?size=128` : null;
  return (
    <div data-testid="widget-discord" className="flex items-center gap-3 p-3 text-left backdrop-blur-md" style={shell(cfg)}>
      <div className="relative">
        {avatar ? <img src={avatar} alt="" className="h-11 w-11 rounded-full" /> : <div className="grid h-11 w-11 place-items-center rounded-full" style={{ background: cfg.accent }}><img src={iconUrl("discord")} alt="" className="h-5 w-5" /></div>}
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0a1422]" style={{ background: STATUS[data?.discord_status || "offline"] }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{u ? u.global_name || u.username : cfg.userId ? "Loading…" : "Discord user"}</div>
        <div className="truncate text-xs text-white/60">{err || (act ? `${act.type === 2 ? "Listening to" : "Playing"} ${act.name}` : custom?.state || data?.discord_status || "Add your Discord ID")}</div>
      </div>
      <img src={iconUrl("discord", cfg.accent)} alt="" className="h-5 w-5 opacity-80" />
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
