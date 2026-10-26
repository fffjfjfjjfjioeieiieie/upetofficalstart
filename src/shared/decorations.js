const DISCORD_DECORATION_PATH = /avatar-decoration-presets\/([^.?/]+)/i;

const isAnimatedImage = (url = "") => /\.(?:gif|apng)(?:[?#]|$)/i.test(url);

export const normalizeDecorations = (list = []) =>
  list
    .filter((item) => item && typeof item.url === "string" && item.url.trim())
    .map((item, index) => {
      const sourceUrl = item.url.trim();
      const discordHash = sourceUrl.match(DISCORD_DECORATION_PATH)?.[1] || "";
      const id = String(item.id || discordHash || `decoration-${index}`);

      if (!discordHash) {
        return {
          id,
          label: item.label || item.name || "Decoration",
          category: item.category || "decorations",
          hash: "",
          animated: typeof item.animated === "boolean" ? item.animated : isAnimatedImage(sourceUrl),
          url: sourceUrl,
          still: sourceUrl,
        };
      }

      const baseUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${discordHash}.png?size=240`;
      return {
        id,
        label: item.label || item.name || "Decoration",
        category: item.category || "decorations",
        hash: discordHash,
        animated: typeof item.animated === "boolean" ? item.animated : discordHash.startsWith("a_"),
        url: `${baseUrl}&passthrough=true`,
        still: `${baseUrl}&passthrough=false`,
      };
    });
