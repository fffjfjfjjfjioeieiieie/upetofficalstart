/** Pure URL-state model for the local homepage playground. */
export const BACKGROUNDS = [
  "image",
  "video",
  "gradient",
  "aurora",
  "underwater",
  "rain",
  "grain",
];
export const FONTS = ["outfit", "sora", "space", "serif", "pixel", "orbitron"];
export const CARD_STYLES = ["ink", "cream", "outline", "glass"];
export const AVATAR_SHAPES = ["circle", "squircle", "square"];
export const LINK_STYLES = ["round", "soft", "square"];

export const DEFAULT_DESIGN = Object.freeze({
  background: "image",
  accent: "#b7ff63",
  font: "outfit",
  card: "ink",
  lens: 38,
  avatar: "circle",
  links: "round",
  music: true,
  preset: "lamp",
});

export const PRESETS = Object.freeze([
  { id: "lamp", label: "Lamp", values: DEFAULT_DESIGN },
  {
    id: "deep",
    label: "Deep sea",
    values: {
      background: "underwater",
      accent: "#8ce8ff",
      font: "sora",
      card: "glass",
      lens: 62,
      avatar: "circle",
      links: "soft",
      music: true,
      preset: "deep",
    },
  },
  {
    id: "paper",
    label: "Paper cut",
    values: {
      background: "grain",
      accent: "#df5c48",
      font: "serif",
      card: "cream",
      lens: 5,
      avatar: "square",
      links: "square",
      music: false,
      preset: "paper",
    },
  },
  {
    id: "rain",
    label: "Night rain",
    values: {
      background: "rain",
      accent: "#b49cff",
      font: "space",
      card: "ink",
      lens: 48,
      avatar: "squircle",
      links: "soft",
      music: true,
      preset: "rain",
    },
  },
  {
    id: "orbit",
    label: "Orbit",
    values: {
      background: "aurora",
      accent: "#ffcf5b",
      font: "orbitron",
      card: "outline",
      lens: 18,
      avatar: "circle",
      links: "round",
      music: false,
      preset: "orbit",
    },
  },
  {
    id: "pixel",
    label: "Tiny web",
    values: {
      background: "gradient",
      accent: "#ff79c6",
      font: "pixel",
      card: "glass",
      lens: 30,
      avatar: "square",
      links: "square",
      music: true,
      preset: "pixel",
    },
  },
]);

const oneOf = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;
const colour = (value) =>
  /^#[0-9a-f]{6}$/i.test(value || "")
    ? value.toLowerCase()
    : DEFAULT_DESIGN.accent;
const lens = (value) =>
  Math.max(
    0,
    Math.min(
      100,
      Number.isFinite(Number(value)) ? Number(value) : DEFAULT_DESIGN.lens,
    ),
  );

export function sanitizeDesign(value = {}) {
  return {
    background: oneOf(value.background, BACKGROUNDS, DEFAULT_DESIGN.background),
    accent: colour(value.accent),
    font: oneOf(value.font, FONTS, DEFAULT_DESIGN.font),
    card: oneOf(value.card, CARD_STYLES, DEFAULT_DESIGN.card),
    lens: lens(value.lens),
    avatar: oneOf(value.avatar, AVATAR_SHAPES, DEFAULT_DESIGN.avatar),
    links: oneOf(value.links, LINK_STYLES, DEFAULT_DESIGN.links),
    music: value.music === false || value.music === "0" ? false : true,
    preset:
      typeof value.preset === "string"
        ? value.preset.slice(0, 20)
        : DEFAULT_DESIGN.preset,
  };
}

export function serializeDesign(value) {
  const design = sanitizeDesign(value);
  const params = new URLSearchParams({
    bg: design.background,
    a: design.accent.slice(1),
    f: design.font,
    c: design.card,
    l: String(design.lens),
    av: design.avatar,
    ln: design.links,
    m: design.music ? "1" : "0",
    p: design.preset,
  });
  return `design=${params.toString()}`;
}

export function deserializeDesign(hash = "") {
  const source = hash.replace(/^#/, "");
  if (!source.startsWith("design=")) return { ...DEFAULT_DESIGN };
  try {
    const params = new URLSearchParams(source.slice(7));
    return sanitizeDesign({
      background: params.get("bg"),
      accent: `#${params.get("a") || ""}`,
      font: params.get("f"),
      card: params.get("c"),
      lens: params.get("l"),
      avatar: params.get("av"),
      links: params.get("ln"),
      music: params.get("m"),
      preset: params.get("p"),
    });
  } catch {
    return { ...DEFAULT_DESIGN };
  }
}

export function designFromPreset(id) {
  const preset = PRESETS.find((item) => item.id === id) || PRESETS[0];
  return sanitizeDesign(preset.values);
}
