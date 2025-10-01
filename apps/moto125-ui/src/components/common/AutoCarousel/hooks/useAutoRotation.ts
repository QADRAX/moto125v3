"use client";

import { useEffect } from "react";

/**
 * Auto-rotation hook: periodically advances the carousel if allowed.
 */
export function useAutoRotation(
  listRef: React.RefObject<HTMLUListElement>,
  opts: {
    intervalMs: number;
    paused: boolean;
    draggingMouse: boolean;
    inertiaRunning: boolean;
    getOffsets: () => { offsets: number[]; idx: number };
    scrollToIndex: (idx: number) => void;
  }
) {
  const {
    intervalMs,
    paused,
    draggingMouse,
    inertiaRunning,
    getOffsets,
    scrollToIndex,
  } = opts;

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    let timer: number | undefined;

    const tick = () => {
      const el = listRef.current;
      if (!el) return;
      const { offsets, idx } = getOffsets();
      if (!offsets.length) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      const nextIdx = atEnd ? 0 : Math.min(idx + 1, offsets.length - 1);
      scrollToIndex(nextIdx);
    };

    const start = () => {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (!document.hidden && !paused && !draggingMouse && !inertiaRunning) {
          tick();
        }
      }, Math.max(1500, intervalMs));
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
    };

    start();
    const onVis = () => {
      stop();
      start();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [intervalMs, paused, draggingMouse, inertiaRunning, getOffsets, scrollToIndex, listRef]);
}
