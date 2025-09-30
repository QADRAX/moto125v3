"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface AutoCarouselProps {
  children: React.ReactNode[];
  intervalMs?: number;
  pauseOnHover?: boolean;
  pauseOnTouchDrag?: boolean;
  snap?: boolean;
  ariaLabel?: string;
}

export default function AutoCarousel({
  children,
  intervalMs = 5000,
  pauseOnHover = true,
  pauseOnTouchDrag = true,
  snap = true,
  ariaLabel = "Carrusel",
}: AutoCarouselProps) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  // para drag
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const isPointerDown = useRef(false);
  const movedPx = useRef(0);

  const items = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  const getOffsets = () => {
    const el = listRef.current;
    if (!el) return { offsets: [], idx: 0 };
    const lis = Array.from(el.querySelectorAll<HTMLLIElement>("li[data-index]"));
    const offsets = lis.map((li) => li.offsetLeft);
    const sl = el.scrollLeft;
    let idx = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (offsets[i] <= sl + 1) idx = i;
      else break;
    }
    return { offsets, idx };
  };

  const scrollToIndex = (nextIdx: number) => {
    const el = listRef.current;
    if (!el) return;
    const lis = el.querySelectorAll<HTMLLIElement>("li[data-index]");
    const target = lis[nextIdx];
    if (!target) return;
    el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  };

  // Auto-rotación
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
        if (!document.hidden && !paused && !dragging) tick();
      }, Math.max(1500, intervalMs));
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
    };

    start();
    const onVis = () => { stop(); start(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [intervalMs, paused, dragging]);

  // Hover/touch pause
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
  }, [pauseOnHover]);

  // Pointer-driven drag (ratón y touch unificados)
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      // Botón principal solo
      if (e.pointerType === "mouse" && e.button !== 0) return;

      isPointerDown.current = true;
      movedPx.current = 0;
      setDragging(true);
      if (pauseOnTouchDrag) setPaused(true);

      dragStartX.current = e.clientX;
      dragStartScroll.current = el.scrollLeft;

      el.setPointerCapture?.(e.pointerId);
      // habilita cursor "grabbing"
      el.classList.add("dragging");
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown.current) return;
      // Evita seleccionar texto/imagenes al arrastrar
      e.preventDefault();

      const dx = e.clientX - dragStartX.current;
      movedPx.current = Math.max(movedPx.current, Math.abs(dx));
      el.scrollLeft = dragStartScroll.current - dx;
    };

    const endDrag = () => {
      if (!isPointerDown.current) return;
      isPointerDown.current = false;
      el.classList.remove("dragging");
      // reanuda tras un micro delay para no pelearse con inercia
      setTimeout(() => {
        setDragging(false);
        if (pauseOnTouchDrag) setPaused(false);
      }, 50);
    };

    const onPointerUp = endDrag;
    const onPointerCancel = endDrag;
    const onPointerLeave = endDrag;

    // Evita clicks si hubo desplazamiento significativo
    const onClickCapture = (e: MouseEvent) => {
      if (movedPx.current > 5) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown as any);
      el.removeEventListener("pointermove", onPointerMove as any);
      el.removeEventListener("pointerup", onPointerUp as any);
      el.removeEventListener("pointercancel", onPointerCancel as any);
      el.removeEventListener("pointerleave", onPointerLeave as any);
      el.removeEventListener("click", onClickCapture as any, true);
    };
  }, [pauseOnTouchDrag]);

  return (
    <div className="relative -mx-4 px-4" aria-label={ariaLabel}>
      <ul
        ref={listRef}
        role="list"
        className={[
          "flex gap-4 overflow-x-auto pb-2 select-none", // select-none mejora la UX de drag
          snap ? "snap-x snap-mandatory scroll-px-4" : "",
          "no-scrollbar cursor-grab",
        ].join(" ")}
      >
        {items.map((child, i) => (
          <li
            key={i}
            data-index={i}
            className="snap-start flex-none w-[260px] sm:w-[300px] lg:w-[340px]"
          >
            {child}
          </li>
        ))}
      </ul>

      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .cursor-grab {
          cursor: grab;
        }
        .dragging {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
}
