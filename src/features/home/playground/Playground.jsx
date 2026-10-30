/** Full local playground with URL-hash persistence and the production renderer. */
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Dices, RotateCcw } from "lucide-react";
import { HOME_COPY } from "../../../content/home-copy.ts";
import { SectionIntro } from "../shared/HomeShared.jsx";
import RealProfile from "../shared/RealProfile.jsx";
import {
  AVATAR_SHAPES,
  BACKGROUNDS,
  CARD_STYLES,
  DEFAULT_DESIGN,
  FONTS,
  LINK_STYLES,
  PRESETS,
  deserializeDesign,
  designFromPreset,
  serializeDesign,
} from "./state.js";
import styles from "./Playground.module.css";

const LABELS = {
  image: "Photo",
  video: "Video",
  gradient: "Gradient",
  aurora: "Aurora",
  underwater: "Underwater",
  rain: "Rain",
  grain: "Grain",
  outfit: "Outfit",
  sora: "Sora",
  space: "Space",
  serif: "Serif",
  pixel: "Pixel",
  orbitron: "Orbitron",
  ink: "Ink",
  cream: "Cream",
  outline: "Outline",
  glass: "Glass",
  circle: "Circle",
  squircle: "Squircle",
  square: "Square",
  round: "Round",
  soft: "Soft",
};
function Chips({ label, values, value, onChange }) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className={styles.chips}>
        {values.map((item) => (
          <button
            type="button"
            key={item}
            aria-pressed={value === item}
            onClick={() => onChange(item)}
          >
            {LABELS[item] || item}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Playground({ design, setDesign }) {
  const [copied, setCopied] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  useEffect(() => {
    const load = () => {
      if (window.location.hash.startsWith("#design="))
        setDesign(deserializeDesign(window.location.hash));
    };
    load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, [setDesign]);
  useEffect(() => {
    const next = `#${serializeDesign(design)}`;
    if (window.location.hash !== next)
      history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}${next}`,
      );
  }, [design]);
  const set = (key) => (value) =>
    setDesign((current) => ({ ...current, [key]: value, preset: "custom" }));
  const randomize = () => {
    setShuffle(true);
    const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    setDesign(designFromPreset(preset.id));
    setTimeout(() => setShuffle(false), 440);
  };
  const copy = async () => {
    await navigator.clipboard.writeText(
      `${location.origin}${location.pathname}#${serializeDesign(design)}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1700);
  };
  const backgroundStyle = useMemo(
    () => ({ "--design-accent": design.accent, "--lens": `${design.lens}px` }),
    [design],
  );
  return (
    <section id="playground" className={styles.section} style={backgroundStyle}>
      <div className={styles.lead}>
        <SectionIntro
          title={HOME_COPY.playground.title}
          sub={HOME_COPY.playground.sub}
        />
        <span>{HOME_COPY.playground.local}</span>
      </div>
      <div className={styles.drafted}>
        <i className={styles.crossA} />
        <i className={styles.crossB} />
        <i className={styles.crossC} />
        <i className={styles.crossD} />
        <aside
          className={styles.controls}
          aria-label={HOME_COPY.playground.controls}
        >
          <div className={styles.top}>
            <strong>{HOME_COPY.playground.controls}</strong>
            <div>
              <button type="button" onClick={randomize}>
                <Dices className={shuffle ? styles.rolling : ""} />
                {HOME_COPY.playground.shuffle}
              </button>
              <button
                type="button"
                onClick={() => setDesign({ ...DEFAULT_DESIGN })}
              >
                <RotateCcw />
                {HOME_COPY.playground.reset}
              </button>
            </div>
          </div>
          <Chips
            label={HOME_COPY.playground.groups.background}
            values={BACKGROUNDS}
            value={design.background}
            onChange={set("background")}
          />
          <label className={styles.colour}>
            <span>{HOME_COPY.playground.groups.accent}</span>
            <input
              type="color"
              value={design.accent}
              onChange={(event) => set("accent")(event.target.value)}
            />
            <b>{design.accent}</b>
          </label>
          <Chips
            label={HOME_COPY.playground.groups.font}
            values={FONTS}
            value={design.font}
            onChange={set("font")}
          />
          <Chips
            label={HOME_COPY.playground.groups.card}
            values={CARD_STYLES}
            value={design.card}
            onChange={set("card")}
          />
          <label className={styles.range}>
            <span>
              {HOME_COPY.playground.groups.lens}
              <b>{design.lens}%</b>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={design.lens}
              onChange={(event) => set("lens")(Number(event.target.value))}
            />
          </label>
          <Chips
            label={HOME_COPY.playground.groups.avatar}
            values={AVATAR_SHAPES}
            value={design.avatar}
            onChange={set("avatar")}
          />
          <Chips
            label={HOME_COPY.playground.groups.links}
            values={LINK_STYLES}
            value={design.links}
            onChange={set("links")}
          />
          <label className={styles.toggle}>
            <span>{HOME_COPY.playground.groups.music}</span>
            <input
              type="checkbox"
              checked={design.music}
              onChange={(event) => set("music")(event.target.checked)}
            />
            <i />
          </label>
          <fieldset>
            <legend>{HOME_COPY.playground.groups.presets}</legend>
            <div className={styles.presets}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={design.preset === preset.id}
                  onClick={() => setDesign(designFromPreset(preset.id))}
                >
                  <i style={{ background: preset.values.accent }} />
                  {preset.label}
                </button>
              ))}
            </div>
          </fieldset>
          <button className={styles.copy} type="button" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? HOME_COPY.playground.copied : HOME_COPY.playground.copy}
          </button>
        </aside>
        <div className={styles.preview} data-background={design.background}>
          <div className={styles.previewBar}>
            <span>
              <i />
              {HOME_COPY.playground.preview}
            </span>
            <code>user.pet/lamp</code>
            <b>{HOME_COPY.playground.local}</b>
          </div>
          <div className={styles.canvas}>
            <RealProfile design={design} />
          </div>
        </div>
      </div>
    </section>
  );
}
