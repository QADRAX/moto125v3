"use client";
import { useEffect } from "react";

type Props = { targetId?: string };

export default function HeaderWatcher({ targetId = "main-header" }: Props) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;

    const onChange = ([entry]: IntersectionObserverEntry[]) => {
      if (entry.isIntersecting) {
        document.body.classList.remove("show-compact-header");
      } else {
        document.body.classList.add("show-compact-header");
      }
    };

    const obs = new IntersectionObserver(onChange, {
      root: null,
      threshold: 0,
    });

    obs.observe(el);
    return () => obs.disconnect();
  }, [targetId]);

  return null;
}
