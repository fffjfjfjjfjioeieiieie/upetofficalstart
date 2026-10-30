/** Small motion system used by the homepage without adding another dependency. */
import { useCallback, useEffect, useRef, useState } from "react";
import { frameScheduler } from "./scheduler.js";

export const MOTION = Object.freeze({
  fast: 180,
  medium: 420,
  slow: 760,
  ease: "cubic-bezier(.22,1,.36,1)",
  spring: { stiffness: 0.13, damping: 0.78, maxTilt: 10 },
});

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function useVisible(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "160px", threshold: 0.05, ...options },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

export function useTilt(max = MOTION.spring.maxTilt) {
  const ref = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const reduced = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node || reduced || !frameScheduler) return undefined;
    const move = (event) => {
      const box = node.getBoundingClientRect();
      target.current.x =
        ((event.clientY - box.top) / box.height - 0.5) * -max * 2;
      target.current.y =
        ((event.clientX - box.left) / box.width - 0.5) * max * 2;
      node.style.setProperty(
        "--pointer-x",
        `${((event.clientX - box.left) / box.width) * 100}%`,
      );
      node.style.setProperty(
        "--pointer-y",
        `${((event.clientY - box.top) / box.height) * 100}%`,
      );
    };
    const leave = () => {
      target.current = { x: 0, y: 0 };
    };
    const unsubscribe = frameScheduler.subscribe(() => {
      const value = current.current;
      value.vx =
        (value.vx + (target.current.x - value.x) * MOTION.spring.stiffness) *
        MOTION.spring.damping;
      value.vy =
        (value.vy + (target.current.y - value.y) * MOTION.spring.stiffness) *
        MOTION.spring.damping;
      value.x += value.vx;
      value.y += value.vy;
      node.style.setProperty("--tilt-x", `${value.x.toFixed(2)}deg`);
      node.style.setProperty("--tilt-y", `${value.y.toFixed(2)}deg`);
    });
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", leave);
    return () => {
      unsubscribe();
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
    };
  }, [max, reduced]);
  return ref;
}

export function useScrollProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!frameScheduler) return undefined;
    return frameScheduler.subscribe(() => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const viewport = window.innerHeight;
      setProgress(
        Math.max(
          0,
          Math.min(1, (viewport - box.top) / (viewport + box.height)),
        ),
      );
    });
  }, []);
  return [ref, progress];
}

export function useMagnetic(strength = 12) {
  const ref = useRef(null);
  const move = useCallback(
    (event) => {
      const node = ref.current;
      if (!node || prefersReducedMotion()) return;
      const box = node.getBoundingClientRect();
      node.style.transform = `translate(${((event.clientX - box.left) / box.width - 0.5) * strength}px, ${((event.clientY - box.top) / box.height - 0.5) * strength}px)`;
    },
    [strength],
  );
  const leave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "";
  }, []);
  return { ref, onPointerMove: move, onPointerLeave: leave };
}

export function createBurst(count = 18, random = Math.random) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    angle: (360 / count) * index + random() * 12,
    distance: 38 + random() * 72,
    size: 4 + random() * 7,
    delay: random() * 80,
  }));
}
