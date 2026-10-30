/** Invite-gated username handoff and interactive layered-U wordmark. */
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, X } from "lucide-react";
import { HOME_COPY, HOME_LINKS } from "../../../content/home-copy.ts";
import styles from "./Closing.module.css";

const normalize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 20);
export default function Closing() {
  const [name, setName] = useState("");
  const [stack, setStack] = useState(0);
  const valid = useMemo(() => /^[a-z0-9][a-z0-9._-]{2,19}$/.test(name), [name]);
  const submit = (event) => {
    event.preventDefault();
    if (valid)
      window.location.assign(
        `/login?create=1&claim=${encodeURIComponent(name)}`,
      );
  };
  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.wordmark}
        onClick={() => setStack((stack + 1) % 4)}
        aria-label="Move the layered user.pet mark"
        style={{ "--stack": stack }}
      >
        <span aria-hidden="true">U</span>
        <span aria-hidden="true">U</span>
        <span aria-hidden="true">U</span>
        <b>user.pet</b>
      </button>
      <div className={styles.content}>
        <h2>{HOME_COPY.closing.title}</h2>
        <p>{HOME_COPY.closing.sub}</p>
        <form onSubmit={submit}>
          <label htmlFor="home-name">{HOME_COPY.closing.prefix}</label>
          <div>
            <span>{HOME_COPY.closing.prefix}</span>
            <input
              id="home-name"
              placeholder={HOME_COPY.closing.placeholder}
              value={name}
              onChange={(event) => setName(normalize(event.target.value))}
            />
            <i data-valid={valid}>{name ? valid ? <Check /> : <X /> : null}</i>
            <button type="submit" disabled={!valid}>
              {HOME_COPY.closing.check}
              <ArrowRight />
            </button>
          </div>
          <small>{HOME_COPY.closing.hint}</small>
        </form>
        <a href={HOME_LINKS.requestAccess} target="_blank" rel="noreferrer">
          {HOME_COPY.closing.request}
          <ArrowUpRight />
        </a>
      </div>
    </section>
  );
}
