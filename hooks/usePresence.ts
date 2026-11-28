"use client";
import { type RefObject, useLayoutEffect, useState } from "react";

/** Exit visuals never retain interaction. Reopening cancels pending removal. */
export function usePresence(open: boolean, ref: RefObject<HTMLElement | null>) {
  const [present, setPresent] = useState(open);
  useLayoutEffect(() => {
    let active = true;
    if (open) {
      setPresent(true);
      return;
    }
    const node = ref.current;
    if (!node) {
      return;
    }
    const animations = node.getAnimations?.() ?? [];
    if (
      !animations.length ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setPresent(false);
      return;
    }
    const finish = () => {
      if (active) {
        setPresent(false);
      }
    };
    const timer = window.setTimeout(finish, 1000);
    Promise.allSettled(animations.map((animation) => animation.finished)).then(
      finish,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, ref]);
  return open || present;
}
