"use client";

import { useEffect } from "react";

/**
 * Adds mouse-only drag with:
 * - Activation threshold (so a tiny move is still a click).
 * - Inertia (momentum) after release.
 * - Optional snap to nearest item after inertia.
 *
 * Touch scrolling is intentionally left to the browser (native momentum).
 */
export function useMouseDragInertia(
  listRef: React.RefObject<HTMLUListElement>,
  opts: {
    snap: boolean;
    pauseOnTouchDrag: boolean;
    setPaused: (v: boolean) => void;
    setDraggingMouse: (v: boolean) => void;
    setInertiaRunning: (v: boolean) => void;
    getOffsets: () => { offsets: number[]; idx: number };
  }
) {
  const {
    snap,
    pauseOnTouchDrag,
    setPaused,
    setDraggingMouse,
    setInertiaRunning,
    getOffsets,
  } = opts;

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // State per interaction
    let isDown = false;
    let isDragging = false;
    let didCapture = false;

    // Kinematics
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0; // px/ms
    let rafId: number | null = null;

    // Click suppression window after a *real* drag
    let suppressClicksUntil = 0;

    const DRAG_CLICK_THRESHOLD = 8;  // px
    const FRICTION = 0.95;
    const MIN_VELOCITY = 0.05;
    const SUPPRESS_WINDOW_MS = 180;

    const cancelMomentum = () => {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const snapToNearest = () => {
      if (!snap) return;
      const host = listRef.current;
      if (!host) return;
      const { offsets } = getOffsets();
      if (!offsets.length) return;
      const targetIdx = offsets.reduce((best, off, i) => {
        const d = Math.abs(off - host.scrollLeft);
        return d < Math.abs(offsets[best] - host.scrollLeft) ? i : best;
      }, 0);
      host.scrollTo({ left: offsets[targetIdx], behavior: "smooth" });
    };

    const momentum = () => {
      const host = listRef.current;
      if (!host) return;

      cancelMomentum();
      setInertiaRunning(true);

      const step = (tPrev: number) => {
        rafId = requestAnimationFrame((tNow) => {
          const dt = Math.max(1, tNow - tPrev);
          host.scrollLeft -= velocity * dt;
          velocity *= FRICTION;

          const atBoundary =
            host.scrollLeft <= 0 ||
            host.scrollLeft + host.clientWidth >= host.scrollWidth;

          if (Math.abs(velocity) < MIN_VELOCITY || atBoundary) {
            setInertiaRunning(false);
            snapToNearest();
            rafId = null;
            return;
          }
          step(tNow);
        });
      };

      rafId = requestAnimationFrame((t) => step(t));
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;

      cancelMomentum();

      isDown = true;
      isDragging = false;
      didCapture = false;

      startX = e.clientX;
      startScroll = el.scrollLeft;
      lastX = e.clientX;
      lastT = performance.now();
      velocity = 0;

      // Do not preventDefault yet nor set dragging state.
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("pointerleave", onPointerUp);
    };

    const activateDrag = (e: PointerEvent) => {
      if (isDragging) return;
      isDragging = true;
      setDraggingMouse(true);
      if (pauseOnTouchDrag) setPaused(true);
      el.classList.add("dragging");
      if (!didCapture) {
        el.setPointerCapture?.(e.pointerId);
        didCapture = true;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown || e.pointerType !== "mouse") return;

      const nowX = e.clientX;
      const dx = nowX - startX;

      // Only activate dragging beyond threshold, keep micro-moves as pure clicks.
      if (!isDragging) {
        if (Math.abs(dx) > DRAG_CLICK_THRESHOLD) {
          activateDrag(e);
        } else {
          return;
        }
      }

      // Real dragging path
      e.preventDefault();
      el.scrollLeft = startScroll - dx;

      const nowT = performance.now();
      const dt = nowT - lastT;
      if (dt > 0) {
        velocity = (nowX - lastX) / dt;
        lastX = nowX;
        lastT = nowT;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !isDown) return;
      isDown = false;

      if (isDragging) {
        // Suppress the synthetic click immediately after a real drag
        suppressClicksUntil = performance.now() + SUPPRESS_WINDOW_MS;

        el.classList.remove("dragging");
        if (didCapture) {
          el.releasePointerCapture?.(e.pointerId);
          didCapture = false;
        }

        if (Math.abs(velocity) > 0.01) momentum();
        else snapToNearest();

        setTimeout(() => {
          setDraggingMouse(false);
          if (pauseOnTouchDrag) setPaused(false);
        }, 40);
      } else {
        // Pure click: do nothing special
      }

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointerleave", onPointerUp);
    };

    const onClickCapture = (e: MouseEvent) => {
      // Cancel only the click right after a drag
      if (performance.now() <= suppressClicksUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      cancelMomentum();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointerleave", onPointerUp);
    };
  }, [
    listRef,
    snap,
    pauseOnTouchDrag,
    setPaused,
    setDraggingMouse,
    setInertiaRunning,
    getOffsets,
  ]);
}
