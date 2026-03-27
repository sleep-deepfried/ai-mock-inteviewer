"use client";

import { useEffect, useState } from "react";

const TYPE_MS = 42;
const DELETE_MS = 28;
const PAUSE_FULL_MS = 2400;
const PAUSE_EMPTY_MS = 650;

export const HERO_PLACEHOLDER_PHRASES = [
  "What role are you interviewing for?",
  "Senior engineer, PM, or designer—say the job you're targeting…",
  "Toggle Behavioral or Technical, add your role, then press the arrow to start.",
  "Attach a resume here if you like—optional but sharper questions.",
  "Voice-first practice: speak naturally, get scored feedback after.",
];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useReducedMotionPreference(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Cycles through phrases with type-in / delete-out when `active` is true.
 */
export function useCyclingTypewriter(active: boolean) {
  const [display, setDisplay] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setDisplay("");
      return;
    }

    let cancelled = false;
    const phrase =
      HERO_PLACEHOLDER_PHRASES[phraseIndex % HERO_PLACEHOLDER_PHRASES.length] ??
      "";

    (async () => {
      for (let len = 1; len <= phrase.length; len++) {
        if (cancelled) return;
        setDisplay(phrase.slice(0, len));
        await wait(TYPE_MS);
      }
      if (cancelled) return;
      await wait(PAUSE_FULL_MS);
      if (cancelled) return;
      for (let len = phrase.length - 1; len >= 0; len--) {
        if (cancelled) return;
        setDisplay(phrase.slice(0, len));
        await wait(DELETE_MS);
      }
      if (cancelled) return;
      await wait(PAUSE_EMPTY_MS);
      if (!cancelled) {
        setPhraseIndex((i) => (i + 1) % HERO_PLACEHOLDER_PHRASES.length);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, phraseIndex]);

  return display;
}
