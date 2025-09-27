"use client";

import { useEffect, useState } from "react";

export type ConsentChoice = "all" | "analytics" | "deny";

export type UseConsentDialogOptions = {
  gaId: string;
  cookieName?: string;
  denyTtlHours?: number;
  grantTtlDays?: number;
};

async function waitForGtag(timeoutMs = 5000) {
  const start = Date.now();
  while (typeof window !== "undefined" && !window.gtag) {
    await new Promise((r) => setTimeout(r, 50));
    if (Date.now() - start > timeoutMs) break;
  }
}

function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

declare global { interface Window { gtag?: (...args: any[]) => void } }

export function useConsentDialog({
  gaId,
  cookieName = "m125-consent",
  denyTtlHours = 12,
  grantTtlDays = 180,
}: UseConsentDialogOptions) {
  const [open, setOpen] = useState(false);
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    const saved = getCookie(cookieName) as ConsentChoice | null;
    setOpen(!saved);
  }, [cookieName]);

  async function fireInitialPV() {
    await waitForGtag();
    window.gtag?.("config", gaId, {
      page_path: location.pathname + location.search,
      debug_mode: isDev,
    });
  }

  async function acceptAnalytics() {
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    setCookie(cookieName, "analytics", grantTtlDays * 24 * 60 * 60);
    await fireInitialPV();
    setOpen(false);
  }

  async function acceptAll() {
    window.gtag?.("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
    setCookie(cookieName, "all", grantTtlDays * 24 * 60 * 60);
    await fireInitialPV();
    setOpen(false);
  }

  function denyAll() {
    window.gtag?.("consent", "update", {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    setCookie(cookieName, "deny", denyTtlHours * 60 * 60); // 👈 solo horas
    setOpen(false);
  }

  return { open, setOpen, acceptAnalytics, acceptAll, denyAll };
}
