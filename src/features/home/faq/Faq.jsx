/** Native-button FAQ accordion with measured, animated panels. */
import { useState } from "react";
import { Plus } from "lucide-react";
import { HOME_COPY, HOME_LINKS } from "../../../content/home-copy.ts";
import styles from "./Faq.module.css";

function linkedAnswer({ index, answer }) {
  if (index === 3)
    return (
      <>
        {answer} <a href={HOME_LINKS.privacy}>{HOME_COPY.footer.privacy}</a> ·{" "}
        <a href={HOME_LINKS.terms}>{HOME_COPY.footer.terms}</a>
      </>
    );
  if (index === 5)
    return (
      <>
        {answer} <a href={HOME_LINKS.contact}>{HOME_COPY.footer.email}</a>
      </>
    );
  return answer;
}
export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className={styles.section}>
      <h2>{HOME_COPY.faq.title}</h2>
      <div>
        {HOME_COPY.faq.items.map(([question, answer], index) => {
          const active = open === index;
          return (
            <article key={question} data-open={active}>
              <h3>
                <button
                  type="button"
                  aria-expanded={active}
                  aria-controls={`faq-${index}`}
                  onClick={() => setOpen(active ? -1 : index)}
                >
                  <span>{question}</span>
                  <Plus />
                </button>
              </h3>
              <div id={`faq-${index}`} role="region" inert={active ? undefined : ""}>
                <p>{linkedAnswer({ index, answer })}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
