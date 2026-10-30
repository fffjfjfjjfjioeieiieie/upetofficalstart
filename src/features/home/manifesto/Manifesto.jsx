/** Warm paper manifesto with scroll progress highlighting and drawn underline. */
import { HOME_COPY } from "../../../content/home-copy.ts";
import { DrawnUnderline } from "../shared/HomeShared.jsx";
import { useScrollProgress } from "../../../lib/motion/index.js";
import styles from "./Manifesto.module.css";

export default function Manifesto() {
  const [ref, progress] = useScrollProgress();
  const words = HOME_COPY.manifesto.statement.split(" ");
  const lit = Math.floor(progress * words.length * 1.35);
  return (
    <section
      ref={ref}
      className={`${styles.section} ${progress > 0.18 ? "is-visible" : ""}`}
    >
      <p>
        {words.map((word, index) => (
          <span key={`${word}-${index}`} data-lit={index <= lit}>
            {word}{" "}
          </span>
        ))}
      </p>
      <DrawnUnderline className={styles.line} />
    </section>
  );
}
