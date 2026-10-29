import { useEffect, useState } from "react";
import { normalizeDecorations } from "../../shared/decorations";

const REMOTE = "https://raw.githubusercontent.com/wickstudio/Discord-Avatar-Decoration-Bot/main/effects.json";
let cache = null;

export const loadDecorations = async () => {
  if (cache) return cache;
  for (const src of ["/decorations.json", REMOTE]) {
    try {
      const res = await fetch(src);
      if (res.ok) {
        cache = normalizeDecorations(await res.json());
        return cache;
      }
    } catch (e) {
      continue;
    }
  }
  return [];
};

export const useDecorations = () => {
  const [state, setState] = useState({ loading: true, items: cache || [] });
  useEffect(() => {
    let alive = true;
    loadDecorations().then((items) => alive && setState({ loading: false, items }));
    return () => { alive = false; };
  }, []);
  return state;
};

export const BADGES = [
  { id: "founder", label: "Founder", color: "#fbbf24", desc: "Founder of user.pet", lockedVisible: true },
  { id: "staff", label: "Staff", color: "#a69dd2", desc: "user.pet team member" },
  { id: "verified", label: "Verified", color: "#3ba7ff", desc: "Verified identity" },
  { id: "premium", label: "Premium", color: "#ffd166", desc: "Supports user.pet" },
  { id: "og", label: "OG", color: "#c4b5fd", desc: "Joined in the first wave" },
  { id: "booster", label: "Booster", color: "#ff73fa", desc: "Boosted the Discord" },
  { id: "bughunter", label: "Bug Hunter", color: "#4ade80", desc: "Reported a real bug" },
  { id: "donor", label: "Donor", color: "#fb7185", desc: "Donated to the project" },
  { id: "seller", label: "Seller", color: "#f59e0b", desc: "Sold on the marketplace" },
];

export const PLATFORMS = [
  "discord", "spotify", "tiktok", "youtube", "x", "instagram", "github", "twitch", "steam", "roblox",
  "namemc", "soundcloud", "telegram", "snapchat", "reddit", "pinterest", "kick", "cashapp", "paypal", "linktree", "website",
];

export const detectPlatform = (url = "") => {
  const u = url.toLowerCase();
  if (u.includes("twitter.com") || u.includes("x.com")) return "x";
  return PLATFORMS.find((p) => p !== "website" && u.includes(p)) || "website";
};

export const iconUrl = (platform, color = "ffffff") => {
  if (platform === "website") return null;
  if (platform === "namemc") return "/icons/namemc.png";
  return `https://cdn.simpleicons.org/${platform}/${color.replace("#", "")}`;
};

export const BRAND = {
  discord: ["5865F2", "https://discord.gg/"], spotify: ["1DB954", "https://open.spotify.com/user/"], tiktok: ["25F4EE", "https://tiktok.com/@"],
  youtube: ["FF0000", "https://youtube.com/@"], x: ["FFFFFF", "https://x.com/"], instagram: ["E4405F", "https://instagram.com/"],
  github: ["FFFFFF", "https://github.com/"], twitch: ["9146FF", "https://twitch.tv/"], steam: ["66C0F4", "https://steamcommunity.com/id/"],
  roblox: ["FFFFFF", "https://roblox.com/users/"], namemc: ["39A9DB", "https://namemc.com/profile/"], soundcloud: ["FF5500", "https://soundcloud.com/"], telegram: ["26A5E4", "https://t.me/"],
  snapchat: ["FFFC00", "https://snapchat.com/add/"], reddit: ["FF4500", "https://reddit.com/u/"], pinterest: ["E60023", "https://pinterest.com/"],
  kick: ["53FC18", "https://kick.com/"], cashapp: ["00D632", "https://cash.app/$"], paypal: ["009CDE", "https://paypal.me/"],
  linktree: ["43E55E", "https://linktr.ee/"], website: ["6CC4FF", "https://"],
};
export const TEXT_FX = ["none", "glitch", "typewriter", "morph", "flicker", "rainbow", "neon", "wave", "bounce", "shake", "gradient", "blurin", "scramble", "rgb", "outline", "pulse", "fire", "ice", "sparkle", "float", "chroma", "3d", "swing"];
