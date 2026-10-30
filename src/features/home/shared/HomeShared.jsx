/** Shared, small visual primitives for otherwise section-specific layouts. */
import { useEffect, useRef, useState } from "react";
import { HOME_COPY } from "../../../content/home-copy.ts";
import { useTilt } from "../../../lib/motion/index.js";
import styles from "./HomeShared.module.css";

export function BrandMark({
  interactive = false,
  onFiveClicks,
  className = "",
}) {
  const clicks = useRef([]);
  const activate = () => {
    const now = Date.now();
    clicks.current = [
      ...clicks.current.filter((time) => now - time < 1600),
      now,
    ];
    if (clicks.current.length >= 5) {
      clicks.current = [];
      onFiveClicks?.();
    }
  };
  const Tag = interactive ? "button" : "span";
  return (
    <Tag
      type={interactive ? "button" : undefined}
      className={`${styles.brand} ${className}`}
      onClick={interactive ? activate : undefined}
      aria-label={interactive ? "user.pet" : undefined}
    >
      <span className={styles.mark} aria-hidden="true">
        <i />
        <i />
        <i>U</i>
      </span>
      <span>user.pet</span>
    </Tag>
  );
}

export function TiltSurface({ children, className = "", label, cursor }) {
  const ref = useTilt();
  return (
    <div
      ref={ref}
      className={`${styles.tilt} ${className}`}
      aria-label={label}
      data-cursor={cursor}
    >
      {children}
      <i className={styles.sheen} aria-hidden="true" />
    </div>
  );
}

export function DrawnUnderline({ className = "" }) {
  return (
    <svg
      className={`${styles.underline} ${className}`}
      viewBox="0 0 320 34"
      aria-hidden="true"
    >
      <path
        pathLength="1"
        d="M5 22C61 5 142 30 314 10M24 28c80-13 158 2 254-14"
      />
    </svg>
  );
}

export function DrawnArrow({ className = "" }) {
  return (
    <svg
      className={`${styles.arrow} ${className}`}
      viewBox="0 0 150 110"
      aria-hidden="true"
    >
      <path pathLength="1" d="M8 13c55 1 105 26 112 73M98 69l23 18 12-28" />
    </svg>
  );
}

export function CustomCursor() {
  const [state, setState] = useState({ x: -80, y: -80, label: "" });
  useEffect(() => {
    if (!matchMedia("(pointer:fine)").matches) return undefined;
    const move = (event) =>
      setState({
        x: event.clientX,
        y: event.clientY,
        label: event.target.closest("[data-cursor]")?.dataset.cursor || "",
      });
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div
      className={styles.cursor}
      data-active={Boolean(state.label)}
      style={{ transform: `translate3d(${state.x}px,${state.y}px,0)` }}
      aria-hidden="true"
    >
      <span>{state.label}</span>
    </div>
  );
}

export function SectionIntro({ title, sub, align = "left", className = "" }) {
  return (
    <header className={`${styles.intro} ${styles[align]} ${className}`}>
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </header>
  );
}

export function LocalBadge() {
  return (
    <span className={styles.localBadge}>{HOME_COPY.playground.local}</span>
  );
}
