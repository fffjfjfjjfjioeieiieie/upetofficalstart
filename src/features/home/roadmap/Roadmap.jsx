/** Honest status-only roadmap rendered as an offset horizontal drafting line. */
import { ArrowDown } from "lucide-react";
import { HOME_COPY } from "../../../content/home-copy.ts";
import styles from "./Roadmap.module.css";

export default function Roadmap() {
  return (
    <section id="roadmap" className={styles.section}>
      <h2>{HOME_COPY.roadmap.title}</h2>
      <div className={styles.track}>
        {HOME_COPY.roadmap.items.map(([name, status], index) => (
          <article key={name} style={{ "--i": index }}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <i />
            <h3>{name}</h3>
            <p>{status}</p>
          </article>
        ))}
      </div>
      <footer>
        <p>{HOME_COPY.roadmap.note}</p>
        <a href="#donations">
          {HOME_COPY.roadmap.seeDonations}
          <ArrowDown />
        </a>
      </footer>
    </section>
  );
}
