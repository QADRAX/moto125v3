"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window { gtag?: (...args: any[]) => void }
}

async function waitForGtag(timeoutMs = 3000) {
  const t0 = Date.now();
  while (!window.gtag && Date.now() - t0 < timeoutMs) {
    await new Promise(r => setTimeout(r, 50));
  }
}

export default function GAListener({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const search = useSearchParams()?.toString();
  const lastSentRef = useRef<string>("");
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
  }, []);

  useEffect(() => {
    const url = search ? `${pathname}?${search}` : pathname;

    if (url === lastSentRef.current) return;
    lastSentRef.current = url;

    (async () => {
      await waitForGtag();
      if (!window.gtag) return;

      window.gtag("event", "page_view", {
        page_path: url,
        page_location: location.href,
        page_title: document.title,
      });
    })();
  }, [pathname, search, gaId]);

  return null;
}
