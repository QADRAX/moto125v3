"use client";

import { useEffect } from "react";

/**
 * Pauses autorotation while hovering the list (desktop only).
 */
export function useHoverPause(
  listRef: React.RefObject<HTMLUListElement>,
  opts: { pauseOnHover: boolean; setPaused: (v: boolean) => void }
) {
  const { pauseOnHover, setPaused } = opts;

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onMouseEnter = () => pauseOnHover && setPaused(true);
    const onMouseLeave = () => pauseOnHover && setPaused(false);

    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", onMouseLeave);

    return () => {
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [pauseOnHover, setPaused, listRef]);
}
