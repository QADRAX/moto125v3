"use client";
import { useEffect } from "react";

export default function MarkArticleAsViewed({ slug }: { slug: string }) {
  useEffect(() => {
    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
      cache: "no-store",
    }).catch(() => {});
  }, [slug]);

  return null;
}