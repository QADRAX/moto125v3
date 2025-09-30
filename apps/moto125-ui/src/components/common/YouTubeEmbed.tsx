import { cookies } from "next/headers";
import YouTubeIframeClient from "./YouTubeIframeClient";
import { normalizeYouTube } from "@/utils/youtube";

export default function YouTubeEmbed({
  src,
  title = "YouTube video",
  className,
  cookieName = "m125-consent",
}: {
  src: string;
  title?: string;
  className?: string;
  cookieName?: string;
}) {
  const consent = cookies().get(cookieName)?.value as
    | "all"
    | "analytics"
    | "deny"
    | undefined;

  const privacyEnhanced = consent !== "all";
  const { embedUrl } = normalizeYouTube(src, { privacyEnhanced });
  if (!embedUrl) return null;
  return (
    <YouTubeIframeClient
      embedUrl={embedUrl}
      title={title}
      className={className}
      srcForAnalytics={src}
    />
  );
}
