/** Local sample analytics chart with keyboard-accessible range and scrubbing. */
import { useMemo, useState } from "react";
import { HOME_COPY } from "../../../content/home-copy.ts";
import { SectionIntro } from "../shared/HomeShared.jsx";
import styles from "./AnalyticsPeek.module.css";

const DATA30 = [
  18, 24, 21, 35, 32, 44, 39, 55, 48, 62, 58, 71, 66, 80, 72, 92, 84, 88, 104,
  96, 111, 108, 119, 115, 132, 127, 141, 136, 152, 148,
];
export default function AnalyticsPeek() {
  const [days, setDays] = useState(7);
  const [active, setActive] = useState(6);
  const data = useMemo(() => DATA30.slice(-days), [days]);
  const points = data
    .map(
      (value, index) =>
        `${(index / (data.length - 1)) * 100},${100 - (value / 160) * 80}`,
    )
    .join(" ");
  const current = data[Math.min(active, data.length - 1)] || 0;
  const scrub = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    setActive(
      Math.round(
        Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)) *
          (data.length - 1),
      ),
    );
  };
  return (
    <section className={styles.section}>
      <div className={styles.copy}>
        <span>{HOME_COPY.analytics.sample}</span>
        <SectionIntro
          title={HOME_COPY.analytics.title}
          sub={HOME_COPY.analytics.sub}
        />
      </div>
      <div className={styles.panel}>
        <header>
          <div>
            <small>{HOME_COPY.analytics.views}</small>
            <strong>{current}</strong>
            <span>+18%</span>
          </div>
          <div role="group" aria-label="Sample analytics range">
            <button
              type="button"
              aria-pressed={days === 7}
              onClick={() => {
                setDays(7);
                setActive(6);
              }}
            >
              {HOME_COPY.analytics.seven}
            </button>
            <button
              type="button"
              aria-pressed={days === 30}
              onClick={() => {
                setDays(30);
                setActive(29);
              }}
            >
              {HOME_COPY.analytics.thirty}
            </button>
          </div>
        </header>
        <div
          className={styles.chart}
          onPointerMove={scrub}
          onPointerDown={scrub}
          tabIndex="0"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setActive(Math.max(0, active - 1));
            if (event.key === "ArrowRight")
              setActive(Math.min(data.length - 1, active + 1));
          }}
          aria-label={`Sample views ${current}`}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="home-chart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#d6ff6d" stopOpacity=".42" />
                <stop offset="1" stopColor="#d6ff6d" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={`0,100 ${points} 100,100`}
              fill="url(#home-chart)"
            />
            <polyline
              points={points}
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <i style={{ left: `${(active / (data.length - 1)) * 100}%` }}>
            <b>{current}</b>
          </i>
        </div>
        <div className={styles.bars}>
          {data.slice(-7).map((value, index) => (
            <i key={index} style={{ height: `${Math.max(12, value / 1.8)}%` }}>
              <span>{value}</span>
            </i>
          ))}
        </div>
        <footer>
          <b>{HOME_COPY.analytics.clicks}</b>
          <span>{Math.round(data.reduce((a, b) => a + b, 0) / 4)}</span>
          <small>{HOME_COPY.analytics.sample}</small>
        </footer>
      </div>
    </section>
  );
}
