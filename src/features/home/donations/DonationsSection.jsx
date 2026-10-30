/** Local-only donation interaction demo with no fetch, auth or payment code. */
import { useEffect, useMemo, useReducer } from "react";
import { Check, Heart, RotateCcw } from "lucide-react";
import { HOME_COPY, HOME_LINKS } from "../../../content/home-copy.ts";
import { createBurst, useReducedMotion } from "../../../lib/motion/index.js";
import {
  DrawnArrow,
  SectionIntro,
  TiltSurface,
} from "../shared/HomeShared.jsx";
import {
  INITIAL_DONATION_DEMO,
  donationDemoReducer,
  validateDemoAmount,
} from "./demo-state.js";
import styles from "./DonationsSection.module.css";

const money = (value) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: value % 1 ? 2 : 0,
  }).format(value);
export default function DonationsSection() {
  const [state, dispatch] = useReducer(
    donationDemoReducer,
    INITIAL_DONATION_DEMO,
  );
  const reduced = useReducedMotion();
  const valid = validateDemoAmount(state.amount);
  const particles = useMemo(() => createBurst(20), [state.count]);
  const submit = (event) => {
    event.preventDefault();
    dispatch({ type: "submit", id: `demo-${state.count + 1}` });
  };
  useEffect(() => {
    if (state.status !== "success") return undefined;
    const timer = setTimeout(() => dispatch({ type: "settle" }), 2200);
    return () => clearTimeout(timer);
  }, [state.status]);
  const progress = Math.min(100, (state.total / 500) * 100);
  return (
    <section id="donations" className={styles.section}>
      <div className={styles.bleed} aria-hidden="true">
        thanks
      </div>
      <div className={styles.copy}>
        <span className={styles.status}>{HOME_COPY.donations.status}</span>
        <SectionIntro
          title={HOME_COPY.donations.title}
          sub={HOME_COPY.donations.sub}
        />
        <p>{HOME_COPY.donations.demo}</p>
        <p>{HOME_COPY.donations.builtIn}</p>
        <div>
          <a href={HOME_LINKS.requestAccess} target="_blank" rel="noreferrer">
            {HOME_COPY.donations.request}
          </a>
          <a href="#faq">{HOME_COPY.donations.how}</a>
        </div>
        <DrawnArrow className={styles.arrow} />
      </div>
      <div className={styles.demo}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Donation demo view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={state.view === "supporter"}
            onClick={() => dispatch({ type: "view", value: "supporter" })}
          >
            {HOME_COPY.donations.supporter}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={state.view === "creator"}
            onClick={() => dispatch({ type: "view", value: "creator" })}
          >
            {HOME_COPY.donations.creator}
          </button>
        </div>
        <TiltSurface
          className={styles.widget}
          label="Donation demo"
          cursor={HOME_COPY.cursor.try}
        >
          {state.view === "supporter" ? (
            <form onSubmit={submit}>
              <div className={styles.creator}>
                <img src="/lamp-saved/avatar.jpg" alt="" />
                <div>
                  <strong>{HOME_COPY.donations.widgetTitle}</strong>
                  <span>{HOME_COPY.donations.demo}</span>
                </div>
                <Heart />
              </div>
              <fieldset>
                <legend>{HOME_COPY.donations.amount}</legend>
                <div className={styles.amounts}>
                  {[3, 10, 25].map((value) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={!state.custom && state.amount === value}
                      onClick={() => dispatch({ type: "amount", value })}
                    >
                      {money(value)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className={styles.custom}>
                <span>{HOME_COPY.donations.custom}</span>
                <div>
                  <b>£</b>
                  <input
                    inputMode="decimal"
                    value={state.custom}
                    placeholder="Other"
                    onChange={(event) =>
                      dispatch({ type: "custom", value: event.target.value })
                    }
                  />
                </div>
              </label>
              {state.status === "error" && (
                <p className={styles.error} role="alert">
                  {HOME_COPY.donations.error}
                </p>
              )}
              <label className={styles.message}>
                <span>{HOME_COPY.donations.message}</span>
                <textarea
                  maxLength="120"
                  value={state.message}
                  onChange={(event) =>
                    dispatch({ type: "message", value: event.target.value })
                  }
                />
                <small>
                  {120 - state.message.length} {HOME_COPY.donations.chars}
                </small>
              </label>
              <button
                className={styles.send}
                type="submit"
                data-success={state.status === "success"}
              >
                {state.status === "success" ? (
                  <>
                    <Check />
                    {HOME_COPY.donations.sent}
                  </>
                ) : (
                  <>
                    {HOME_COPY.donations.send} {valid.ok && money(valid.amount)}
                  </>
                )}
              </button>
              {state.status === "success" && !reduced && (
                <div className={styles.burst} aria-hidden="true">
                  {particles.map((p) => (
                    <i
                      key={p.id}
                      style={{
                        "--angle": `${p.angle}deg`,
                        "--distance": `${p.distance}px`,
                        "--size": `${p.size}px`,
                        "--delay": `${p.delay}ms`,
                      }}
                    />
                  ))}
                </div>
              )}
            </form>
          ) : (
            <div className={styles.dashboard}>
              <span>{HOME_COPY.donations.sample}</span>
              <h3>{HOME_COPY.donations.creatorTitle}</h3>
              <div className={styles.total}>
                <small>{HOME_COPY.donations.recent}</small>
                <strong>{money(state.total)}</strong>
                <b>{state.count}</b>
              </div>
              <div className={styles.goal}>
                <span>
                  <b>{HOME_COPY.donations.goal}</b>
                  <b>{Math.round(progress)}%</b>
                </span>
                <i>
                  <u style={{ width: `${progress}%` }} />
                </i>
              </div>
              <div className={styles.feed}>
                {state.supporters.length ? (
                  state.supporters.map((item) => (
                    <article key={item.id}>
                      <Heart />
                      <div>
                        <b>{item.name}</b>
                        <span>{item.message || HOME_COPY.donations.added}</span>
                      </div>
                      <strong>{money(item.amount)}</strong>
                    </article>
                  ))
                ) : (
                  <p>{HOME_COPY.donations.demo}</p>
                )}
              </div>
            </div>
          )}
        </TiltSurface>
        <div className={styles.demoBottom}>
          <span>{HOME_COPY.donations.demo}</span>
          <button type="button" onClick={() => dispatch({ type: "reset" })}>
            <RotateCcw />
            {HOME_COPY.donations.reset}
          </button>
        </div>
        <div className="sr-only" aria-live="polite">
          {state.status === "success" ? HOME_COPY.donations.added : ""}
        </div>
      </div>
    </section>
  );
}
