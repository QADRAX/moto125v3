import React from "react";
import type { Article } from "@moto125/api-client";

function fmt(date?: string | null) {
  if (!date) return "";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return date ?? "";
  }
}

export default function ArticleCard({ article }: { article: Article }) {
  const coverUrl = article.coverImage?.url;
  return (
    <article
      style={{
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 16,
        display: "grid",
        gap: 8
      }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={article.title ?? article.slug}
          style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8 }}
        />
      ) : null}
      <h3 style={{ margin: 0 }}>{article.title ?? article.slug}</h3>
      <small style={{ color: "#666" }}>{fmt(article.publicationDate ?? article.publishedAt)}</small>
    </article>
  );
}
