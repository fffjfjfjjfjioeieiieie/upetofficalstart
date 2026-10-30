/** Logged-out fourth-pass homepage composition and local interaction wiring. */
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { HOME_COPY } from "../../content/home-copy.ts";
import { DEFAULT_DESIGN, designFromPreset } from "./playground/state.js";
import Hero from "./hero/Hero.jsx";
import HomeFooter from "./footer/HomeFooter.jsx";
import styles from "./HomePage.module.css";

const Playground = lazy(() => import("./playground/Playground.jsx"));
const EffectsRail = lazy(() => import("./effects/EffectsRail.jsx"));
const ProfileWall = lazy(() => import("./wall/ProfileWall.jsx"));
const BuildStory = lazy(() => import("./story/BuildStory.jsx"));
const DonationsSection = lazy(() => import("./donations/DonationsSection.jsx"));
const AnalyticsPeek = lazy(() => import("./analytics/AnalyticsPeek.jsx"));
const Manifesto = lazy(() => import("./manifesto/Manifesto.jsx"));
const Roadmap = lazy(() => import("./roadmap/Roadmap.jsx"));
const Faq = lazy(() => import("./faq/Faq.jsx"));
const Closing = lazy(() => import("./closing/Closing.jsx"));
const SectionFallback = () => (
  <div className={styles.fallback} aria-hidden="true" />
);
function DeferredSection({ id, children, minHeight = "75vh" }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { rootMargin: "900px 0px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  if (ready)
    return <Suspense fallback={<SectionFallback />}>{children}</Suspense>;
  return (
    <div
      id={id}
      ref={ref}
      className={styles.defer}
      style={{ minHeight }}
      aria-hidden="true"
    />
  );
}
export default function HomePage() {
  const [design, setDesign] = useState({ ...DEFAULT_DESIGN });
  useEffect(() => {
    document.title = HOME_COPY.meta.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = HOME_COPY.meta.description;
  }, []);
  useEffect(() => {
    const sequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    let index = 0;
    const key = (event) => {
      index =
        event.key.toLowerCase() === sequence[index].toLowerCase()
          ? index + 1
          : 0;
      if (index === sequence.length) {
        index = 0;
        document.documentElement.classList.add(styles.konami);
        setTimeout(
          () => document.documentElement.classList.remove(styles.konami),
          900,
        );
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, []);
  const useEffectDesign = useCallback((background) => {
    setDesign((current) => ({ ...current, background, preset: "custom" }));
    document
      .getElementById("playground")
      ?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }, []);
  const remix = useCallback(() => {
    setDesign(designFromPreset("lamp"));
    document
      .getElementById("playground")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);
  return (
    <main className={styles.home}>
      <Hero
        design={design}
        onPresetCycle={(id) => setDesign(designFromPreset(id))}
      />
      <>
        <DeferredSection id="playground">
          <Playground design={design} setDesign={setDesign} />
        </DeferredSection>
        <DeferredSection>
          <EffectsRail onUse={useEffectDesign} />
        </DeferredSection>
        <DeferredSection id="profiles">
          <ProfileWall onRemix={remix} />
        </DeferredSection>
        <DeferredSection minHeight="220vh">
          <BuildStory design={design} />
        </DeferredSection>
        <DeferredSection id="donations">
          <DonationsSection />
        </DeferredSection>
        <DeferredSection>
          <AnalyticsPeek />
        </DeferredSection>
        <DeferredSection>
          <Manifesto />
        </DeferredSection>
        <DeferredSection id="roadmap">
          <Roadmap />
        </DeferredSection>
        <DeferredSection id="faq">
          <Faq />
        </DeferredSection>
        <DeferredSection>
          <Closing />
        </DeferredSection>
      </>
      <HomeFooter />
    </main>
  );
}
