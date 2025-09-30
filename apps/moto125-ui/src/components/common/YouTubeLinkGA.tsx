"use client";

import { useGAEvent } from "@/hooks/useGAEvent";
import { YouTubeIcon } from "./YoutubeIcon";
import { normalizeYouTube } from "@/utils/youtube";

export default function YouTubeLinkGA({
  href,
  ariaLabel = "Ver vídeo en YouTube (se abre en una pestaña nueva)",
  className = "inline-flex items-center justify-center text-white",
  size = 36,
  eventParams,
}: {
  href: string;
  ariaLabel?: string;
  className?: string;
  size?: number;
  eventParams?: Record<string, any>;
}) {
  const { trackEvent } = useGAEvent();

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.stopPropagation();
    trackEvent("youtube_open", {
      event_category: "engagement",
      event_label: href,
      ...eventParams,
    });
  }

  const { watchUrl } = normalizeYouTube(href);
  const url = watchUrl ?? href;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer external"
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <YouTubeIcon className="w-5 h-5" />
    </a>
  );
}
