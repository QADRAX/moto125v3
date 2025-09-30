import { cookies } from "next/headers";
import YouTubeIframeClient from "./YouTubeIframeClient";

function parseYouTube(input: string): { id: string | null; query: string } {
  const allowedParams = new Set(["start", "si", "t"]);
  try {
    if (!input.includes("/") && !input.includes("?")) {
      return { id: input.trim(), query: "" };
    }
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.slice(1);
      const q = [...url.searchParams.entries()]
        .filter(([k]) => allowedParams.has(k))
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
      return { id, query: q ? `?${q}` : "" };
    }
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      const q = [...url.searchParams.entries()]
        .filter(([k]) => allowedParams.has(k))
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
      return { id, query: q ? `?${q}` : "" };
    }
  } catch {}
  return { id: input?.trim() || null, query: "" };
}

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
  const { id, query } = parseYouTube(src);
  if (!id) return null;

  const consent = cookies().get(cookieName)?.value as
    | "all"
    | "analytics"
    | "deny"
    | undefined;

  const base =
    consent === "all"
      ? "https://www.youtube.com"
      : "https://www.youtube-nocookie.com";

  const embedUrl = `${base}/embed/${encodeURIComponent(id)}${query}`;

  return (
    <YouTubeIframeClient
      embedUrl={embedUrl}
      title={title}
      className={className}
      srcForAnalytics={src}
    />
  );
}
