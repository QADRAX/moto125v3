"use client";

import { useEffect, useRef } from "react";

export function useVisibilityOnce<T extends Element>(
  onSeen: () => void,
  options: IntersectionObserverInit = { threshold: 0.6 }
) {
  const ref = useRef<T | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || firedRef.current) return;

    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (visible && !firedRef.current) {
        firedRef.current = true;
        onSeen();
        io.disconnect();
      }
    }, options);

    io.observe(el);
    return () => io.disconnect();
  }, [onSeen, options.root, options.rootMargin, options.threshold]);

  return ref;
}