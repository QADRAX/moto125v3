"use client";

import { useGAEvent } from "@/hooks/useGAEvent";
import { YouTubeIcon } from "./YoutubeIcon";
import { normalizeYouTube } from "@/utils/normalizeYoutubeLink";

export default function YouTubeLinkGA({
  href,
  ariaLabel = "Ver vídeo en YouTube (se abre en una pestaña nueva)",
  className = "inline-flex items-center justify-center text-white cursor-pointer",
  size = 36,
  eventParams,
  as = "button", // 'button' | 'a'
}: {
  href: string;
  ariaLabel?: string;
  className?: string;
  size?: number;
  eventParams?: Record<string, any>;
  as?: "button" | "a";
}) {
  const { trackEvent } = useGAEvent();
  const { watchUrl } = normalizeYouTube(href);
  const url = watchUrl ?? href;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();

    trackEvent("youtube_open", {
      event_category: "engagement",
      event_label: url,
      ...eventParams,
    });

    if (as === "button") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  if (as === "a") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer external"
        aria-label={ariaLabel}
        className={className}
        onClick={handleClick}
        style={{ width: size, height: size }}
      >
        <YouTubeIcon className="w-5 h-5" />
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      style={{ width: size, height: size }}
    >
      <YouTubeIcon className="w-5 h-5" />
    </button>
  );
}
