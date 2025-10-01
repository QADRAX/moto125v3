"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { CarouselList } from "./CarouselList";
import { getOffsets, scrollToIndex, handleCardClick } from "./utils";
import { useAutoRotation } from "./hooks/useAutoRotation";
import { useHoverPause } from "./hooks/useHoverPause";
import { useMouseDragInertia } from "./hooks/useMouseDragInertia";

export interface AutoCarouselProps {
  children: ReactNode[] | ReactNode;
  intervalMs?: number;
  pauseOnHover?: boolean;
  pauseOnTouchDrag?: boolean;
  snap?: boolean;
  ariaLabel?: string;
}

/**
 * Public AutoCarousel component:
 * - Native touch momentum (no JS handlers for touch).
 * - Mouse drag with activation threshold, inertia and optional snap.
 * - Auto-rotation with visibility handling.
 * - Clicks preserved; card click can forward to first inner <a>.
 */
export default function AutoCarousel({
  children,
  intervalMs = 5000,
  pauseOnHover = true,
  pauseOnTouchDrag = true,
  snap = true,
  ariaLabel = "Carrusel",
}: AutoCarouselProps) {
  const listRef = useRef<HTMLUListElement | null>(null);

  // UI state that affects autoplay and styles
  const [paused, setPaused] = useState(false);
  const [draggingMouse, setDraggingMouse] = useState(false);
  const [inertiaRunning, setInertiaRunning] = useState(false);

  // Normalize children to an array
  const items = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  // Stable helpers bound to current ref
  const getOffsetsCb = useCallback(() => getOffsets(listRef.current), []);
  const scrollToIndexCb = useCallback(
    (idx: number) => scrollToIndex(listRef.current, idx),
    []
  );

  // Hooks: behavior split by concern
  useAutoRotation(listRef, {
    intervalMs,
    paused,
    draggingMouse,
    inertiaRunning,
    getOffsets: getOffsetsCb,
    scrollToIndex: scrollToIndexCb,
  });

  useHoverPause(listRef, { pauseOnHover, setPaused });

  useMouseDragInertia(listRef, {
    snap,
    pauseOnTouchDrag,
    setPaused,
    setDraggingMouse,
    setInertiaRunning,
    getOffsets: getOffsetsCb,
  });

  return (
    <div className="relative -mx-4 px-4" aria-label={ariaLabel}>
      <CarouselList
        ref={listRef}
        snapping={snap && !draggingMouse && !inertiaRunning}
        draggingMouse={draggingMouse}
      >
        {items.map((child, i) => (
          <li
            key={i}
            data-index={i}
            className="snap-start flex-none w-[260px] sm:w-[300px] lg:w-[340px]"
            onClick={handleCardClick}
          >
            {child}
          </li>
        ))}
      </CarouselList>
    </div>
  );
}
