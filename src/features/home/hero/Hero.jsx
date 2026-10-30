/** Homepage masthead, navigation, intro and the real Lamp renderer. */
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { HOME_COPY, HOME_LINKS } from "../../../content/home-copy.ts";
import { BrandMark, CustomCursor, TiltSurface } from "../shared/HomeShared.jsx";
import { PRESETS } from "../playground/state.js";
import styles from "./Hero.module.css";

const RealProfile = lazy(() => import("../shared/RealProfile.jsx"));

export default function Hero({ design, onPresetCycle }) {
  const [intro, setIntro] = useState(false);
  const presetIndex = useRef(0);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      if (!reduced && !sessionStorage.getItem("upet-home-intro")) {
        setIntro(true);
        sessionStorage.setItem("upet-home-intro", "1");
      }
    } catch {
      /* Storage can be unavailable in private contexts. */
    }
    const timer = window.setTimeout(() => setIntro(false), 1050);
    return () => clearTimeout(timer);
  }, []);
  const cycle = () => {
    presetIndex.current = (presetIndex.current + 1) % PRESETS.length;
    onPresetCycle(PRESETS[presetIndex.current].id);
  };
  return (
    <>
      {intro && (
        <div className={styles.intro} aria-hidden="true">
          <span>
            <i>U</i>
            <i>U</i>
            <i>U</i>
          </span>
          <b>user.pet</b>
        </div>
      )}
      <CustomCursor />
      <header className={styles.nav}>
        <a href="#top">
          <BrandMark interactive onFiveClicks={cycle} />
        </a>
        <nav aria-label="Primary navigation">
          <a href="#playground">{HOME_COPY.nav.tryIt}</a>
          <a href="#donations">{HOME_COPY.nav.donations}</a>
          <a href="#profiles">{HOME_COPY.nav.profiles}</a>
          <a href="#roadmap">{HOME_COPY.nav.roadmap}</a>
          <a href="#faq">{HOME_COPY.nav.faq}</a>
        </nav>
        <div className={styles.actions}>
          <a href={HOME_LINKS.login}>{HOME_COPY.nav.login}</a>
          <a
            href={HOME_LINKS.requestAccess}
            className={styles.primary}
            target="_blank"
            rel="noreferrer"
          >
            {HOME_COPY.nav.request}
            <ArrowUpRight />
          </a>
        </div>
      </header>
      <section id="top" className={styles.hero}>
        <div className={styles.copy}>
          <h1>
            <span>{HOME_COPY.hero.lineOne}</span>
            <em>{HOME_COPY.hero.lineTwo}</em>
          </h1>
          <p>{HOME_COPY.hero.sub}</p>
          <div className={styles.buttons}>
            <a
              href="#playground"
              className={styles.primary}
              data-cursor={HOME_COPY.cursor.try}
            >
              {HOME_COPY.hero.primary}
              <ArrowDown />
            </a>
            <a href={HOME_LINKS.requestAccess} target="_blank" rel="noreferrer">
              {HOME_COPY.hero.secondary}
              <ArrowUpRight />
            </a>
          </div>
          <small>{HOME_COPY.hero.note}</small>
        </div>
        <div className={styles.visual}>
          <span className={styles.pill}>{HOME_COPY.hero.pill}</span>
          <TiltSurface
            className={styles.frame}
            cursor={HOME_COPY.cursor.try}
            label="Interactive Lamp profile card"
          >
            <Suspense fallback={<div className={styles.profileFallback} />}>
              <RealProfile design={design} />
            </Suspense>
          </TiltSurface>
          <svg className={styles.star} viewBox="0 0 80 80" aria-hidden="true">
            <path d="M40 2c1 25 13 37 38 38-25 1-37 13-38 38-1-25-13-37-38-38C27 39 39 27 40 2Z" />
          </svg>
        </div>
      </section>
      <div className={styles.marquee} aria-label={HOME_COPY.marquee.join(", ")}>
        <div>
          {[...HOME_COPY.marquee, ...HOME_COPY.marquee].map((item, index) => (
            <span key={`${item}-${index}`}>
              {item}
              <i>✦</i>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
