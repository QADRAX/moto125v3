"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function GAListener({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const search = useSearchParams()?.toString();

  useEffect(() => {
    if (!window.gtag) return;
    const url = search ? `${pathname}?${search}` : pathname;
    window.gtag("config", gaId, { page_path: url });
  }, [pathname, search, gaId]);

  return null;
}
