/** Homepage footer with optional local WebAudio feedback, off by default. */
import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { HOME_COPY, HOME_LINKS } from "../../../content/home-copy.ts";
import { BrandMark } from "../shared/HomeShared.jsx";
import styles from "./HomeFooter.module.css";

export default function HomeFooter() {
  const [sound, setSound] = useState(() => {
    try {
      return localStorage.getItem("upet-home-sound") === "on";
    } catch {
      return false;
    }
  });
  const toggle = () => {
    const next = !sound;
    setSound(next);
    try {
      localStorage.setItem("upet-home-sound", next ? "on" : "off");
    } catch {}
    if (next) {
      const C = window.AudioContext || window.webkitAudioContext;
      const context = new C();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
      osc.connect(gain).connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.12);
    }
  };
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div>
          <a href="#top">
            <BrandMark />
          </a>
          <p>{HOME_COPY.footer.tagline}</p>
        </div>
        <p>{HOME_COPY.footer.aside}</p>
      </div>
      <div className={styles.links}>
        <div>
          <b>{HOME_COPY.footer.product}</b>
          <a href="#playground">{HOME_COPY.nav.tryIt}</a>
          <a href="#profiles">{HOME_COPY.nav.profiles}</a>
          <a href="#donations">{HOME_COPY.nav.donations}</a>
        </div>
        <div>
          <b>{HOME_COPY.footer.legal}</b>
          <a href={HOME_LINKS.terms}>{HOME_COPY.footer.terms}</a>
          <a href={HOME_LINKS.privacy}>{HOME_COPY.footer.privacy}</a>
        </div>
        <div>
          <b>{HOME_COPY.footer.contact}</b>
          <a href={HOME_LINKS.contact}>{HOME_COPY.footer.email}</a>
          <a href={HOME_LINKS.requestAccess} target="_blank" rel="noreferrer">
            {HOME_COPY.footer.community}
          </a>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© 2026 user.pet</span>
        <button type="button" aria-pressed={sound} onClick={toggle}>
          {sound ? <Volume2 /> : <VolumeX />}
          {sound ? HOME_COPY.footer.soundOn : HOME_COPY.footer.soundOff}
        </button>
      </div>
    </footer>
  );
}
