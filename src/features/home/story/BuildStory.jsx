/** Scroll-driven build sequence with a sticky profile that changes by step. */
import { HOME_COPY } from "../../../content/home-copy.ts";
import { DrawnArrow } from "../shared/HomeShared.jsx";
import RealProfile from "../shared/RealProfile.jsx";
import { useScrollProgress } from "../../../lib/motion/index.js";
import styles from "./BuildStory.module.css";

export default function BuildStory({ design }) {
  const [ref, progress] = useScrollProgress();
  const step = Math.min(3, Math.floor(progress * 4));
  return (
    <section ref={ref} className={styles.section}>
      <div className={styles.sticky}>
        <p>{HOME_COPY.story.title}</p>
        <div className={styles.phone} data-step={step}>
          <RealProfile
            design={{
              ...design,
              background: ["grain", "gradient", "aurora", "underwater"][step],
              accent: ["#eee9df", "#ff8f70", "#d6ff6d", "#8ce8ff"][step],
            }}
          />
        </div>
        <DrawnArrow className={styles.arrow} />
      </div>
      <ol>
        {HOME_COPY.story.steps.map(([title, body], index) => (
          <li key={title} data-active={step === index}>
            <span>{index + 1}</span>
            <div>
              <h2>{title}</h2>
              <p>{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
