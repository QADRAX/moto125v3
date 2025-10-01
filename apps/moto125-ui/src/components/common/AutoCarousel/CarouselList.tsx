"use client";

import { forwardRef } from "react";
import type { PropsWithChildren } from "react";

/**
 * Presentational list wrapper for the carousel.
 * - Keeps global classes tidy and centralizes inline styles.
 * - `snapping` toggles CSS scroll-snap during mouse drag / inertia.
 */
export const CarouselList = forwardRef<
  HTMLUListElement,
  PropsWithChildren<{
    snapping: boolean;
    draggingMouse: boolean;
  }>
>(function CarouselList({ children, snapping, draggingMouse }, ref) {
  return (
    <ul
      ref={ref}
      role="list"
      tabIndex={0}
      className={[
        "flex gap-4 overflow-x-auto pb-2 select-none no-scrollbar",
        draggingMouse ? "cursor-grabbing" : "cursor-grab",
        "scroll-px-4",
      ].join(" ")}
      style={{
        touchAction: "pan-x",
        scrollSnapType: snapping ? "x mandatory" : "none",
      }}
      aria-roledescription="carousel"
      aria-live="polite"
    >
      {children}
    </ul>
  );
});
