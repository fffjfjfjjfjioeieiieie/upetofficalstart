/** Keyboard and pointer-draggable rail of live CSS effect previews. */
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { HOME_COPY } from "../../../content/home-copy.ts";
import { SectionIntro } from "../shared/HomeShared.jsx";
import styles from "./EffectsRail.module.css";

const EFFECTS = [
  ["underwater", "Underwater"],
  ["aurora", "Aurora"],
  ["rain", "Rain"],
  ["grain", "Paper grain"],
  ["gradient", "Heat map"],
  ["image", "Snow"],
  ["video", "Slow tide"],
  ["underwater", "Blue hour"],
  ["aurora", "Northern light"],
];
export default function EffectsRail({ onUse }) {
  const rail = useRef(null);
  const drag = useRef(null);
  const [active, setActive] = useState(0);
  const down = (event) => {
    drag.current = { x: event.clientX, left: rail.current.scrollLeft };
    rail.current.setPointerCapture(event.pointerId);
  };
  const move = (event) => {
    if (drag.current)
      rail.current.scrollLeft =
        drag.current.left - (event.clientX - drag.current.x);
  };
  const up = () => {
    drag.current = null;
  };
  const key = (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const next = Math.max(
      0,
      Math.min(
        EFFECTS.length - 1,
        active + (event.key === "ArrowRight" ? 1 : -1),
      ),
    );
    setActive(next);
    rail.current.children[next]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <SectionIntro
          title={HOME_COPY.effects.title}
          sub={HOME_COPY.effects.sub}
        />
        <p>{HOME_COPY.effects.instructions}</p>
      </div>
      <div
        ref={rail}
        className={styles.rail}
        role="listbox"
        aria-label="Profile effects"
        tabIndex="0"
        onKeyDown={key}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        data-cursor={HOME_COPY.cursor.drag}
      >
        {EFFECTS.map(([id, name], index) => (
          <div
            key={`${id}-${name}`}
            className={styles.tile}
            data-effect={id}
            role="option"
            aria-selected={active === index}
            tabIndex="0"
            onFocus={() => setActive(index)}
          >
            <div className={styles.scene}>
              <i />
              <i />
              <i />
              <span />
            </div>
            <div>
              <h3>{name}</h3>
              <button type="button" onClick={() => onUse(id)}>
                {HOME_COPY.effects.action}
                <ArrowRight />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
