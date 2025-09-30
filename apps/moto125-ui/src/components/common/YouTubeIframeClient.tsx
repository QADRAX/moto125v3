"use client";

import { useGAEvent } from "@/hooks/useGAEvent";

export default function YouTubeIframeClient({
  embedUrl,
  title = "YouTube video",
  className,
  srcForAnalytics,
}: {
  embedUrl: string;
  title?: string;
  className?: string;
  srcForAnalytics?: string;
}) {
  const { trackEvent } = useGAEvent();

  function handleClick() {
    trackEvent("youtube_click", {
      event_category: "engagement",
      event_label: srcForAnalytics ?? embedUrl,
    });
  }

  return (
    <div className={className}>
      <div
        className="relative w-full"
        style={{ paddingBottom: "56.25%" }}
        onClick={handleClick}
      >
        <iframe
          className="absolute left-0 top-0 h-full w-full"
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  );
}
