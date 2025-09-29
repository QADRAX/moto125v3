"use client";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function useGAEvent() {
  function trackEvent(
    action: string,
    params?: Record<string, any>
  ) {
    if (!window.gtag) {
        console.log("KLK?");
        return;
    }
    window.gtag("event", action, {
      page_path: location.pathname + location.search,
      ...params,
    });
  }

  return { trackEvent };
}
