/** Public-only, committed snapshot of the allowlisted /lamp profile. */
export const FEATURED_PROFILE_ALLOWLIST = Object.freeze(["lamp"]);

export const lampProfile = Object.freeze({
  username: "lamp",
  displayName: "lamp",
  bio: "i own upet",
  location: "UK",
  media: {
    avatar: {
      src: "/lamp-saved/avatar.jpg",
      type: "image",
      zoom: 1,
      blur: 0,
      rotate: -17,
      size: 88,
      x: 50,
      y: 50,
    },
    banner: {
      src: "/lamp-saved/banner.jpg",
      type: "image",
      zoom: 1,
      blur: 2,
      rotate: 0,
      size: 99,
      x: 50,
      y: 50,
    },
    background: {
      src: "/lamp-saved/background.jpg",
      type: "image",
      zoom: 1,
      blur: 0,
      rotate: 0,
      size: 100,
      x: 50,
      y: 50,
    },
    cursor: {
      src: "",
      type: "",
      zoom: 1,
      blur: 0,
      rotate: 0,
      size: 73,
      x: 50,
      y: 50,
    },
  },
  effects: {
    text: "shimmer",
    textColor: "#1c71d8",
    background: "snow",
    backgroundParams: {},
    backgroundAmount: 52,
    backgroundColor: "#9a9996",
    overlay: "none",
    decoration: {
      id: "1352687923060936756",
      label: "Angry",
      url: "/lamp-saved/angry-decoration.png",
    },
    decoHue: 0,
    decoSize: 120,
    decoStyle: "image",
    decoOffset: 0,
    decoSpeed: 1,
    decoIntensity: 0.7,
    webgl: {},
    webglIntensity: 1,
    wind: { mode: "breezy", direction: 0 },
  },
  card: {
    layout: "banner",
    alpha: 0.82,
    radius: 10,
    width: 494,
    blur: 18,
    accent: "#ffffff",
    cardColor: "#000000",
    textColor: "#f7f8fc",
    bgColor: "#000000",
    borderAlpha: 0.15,
    tilt: true,
  },
  links: [
    {
      id: "lamp-support",
      label: "user.pet support & contact",
      url: "https://discord.gg/upet",
      platform: "discord",
      type: "link",
    },
    {
      id: "lamp-tiktok",
      label: "user.pet official tiktok",
      url: "https://tiktok.com/@userpetoffical",
      platform: "tiktok",
      type: "link",
    },
  ],
  audio: {
    src: "",
    sourceType: "",
    title: "snakelike (the stars collide)",
    artist: "whatsaheart",
    cover: "/lamp-saved/cover.jpg",
    autoplay: false,
    volume: 0,
    loop: false,
    playerPlacement: "card",
    playerBackground: "#ffffff",
    playerTextColor: "#ffffff",
    playerOpacity: 0,
    playerScale: 100,
    playerRadius: 21,
    playerBlur: 0,
    playerCoverSize: 28,
    playerEffect: "none",
    playerShowProgress: false,
    playerProgressStyle: "rounded",
    playerProgressHeight: 4,
    playerProgressColor: "#6cc4ff",
    playerProgressGlow: false,
    playerShowCover: true,
    playerShowArtist: true,
    playerBorder: false,
  },
  linkStyle: {
    mode: "list",
    iconColor: "white",
    glow: 0.3,
    glowColor: "#3d3846",
    size: 18,
    radius: 24,
  },
  shownBadges: [
    "founder",
    "staff",
    "verified",
    "premium",
    "og",
    "booster",
    "bughunter",
  ],
});

const PRIVATE_FIELDS = new Set([
  "email",
  "uid",
  "userId",
  "inviteCode",
  "ip",
  "analytics",
  "stripeCustomerId",
]);
export function stripPrivateProfileFields(value) {
  if (Array.isArray(value)) return value.map(stripPrivateProfileFields);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !PRIVATE_FIELDS.has(key))
      .map(([key, child]) => [key, stripPrivateProfileFields(child)]),
  );
}

export function qualifiesForWall(
  profile,
  allowlist = FEATURED_PROFILE_ALLOWLIST,
) {
  return Boolean(
    profile &&
      allowlist.includes(profile.username) &&
      profile.public !== false &&
      !profile.banned &&
      !profile.flagged &&
      profile.media?.avatar?.src &&
      profile.links?.length >= 2,
  );
}

export const featuredProfiles = qualifiesForWall(lampProfile)
  ? [stripPrivateProfileFields(lampProfile)]
  : [];
