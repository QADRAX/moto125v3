"use client";

import * as React from "react";
import type { Article } from "@moto125/api-client";
import SectionHeader from "@/components/common/SectionHeader";
import RelatedArticleRow from "./RelatedArticleRow";

export interface RelatedArticlesProps {
  articles?: Article[] | null;
  title?: string;
  className?: string;
  limit?: number;     // default 10
  batchSize?: number; // default 5
}

export default function RelatedArticles({
  articles,
  title = "Artículos relacionados",
  className = "",
  limit = 10,
  batchSize = 5,
}: RelatedArticlesProps) {
  const list = (articles ?? []).filter(Boolean);
  const safeInitial = Math.max(0, Math.floor(limit));
  const safeBatch = Math.max(1, Math.floor(batchSize));

  const [visibleCount, setVisibleCount] = React.useState(safeInitial);

  React.useEffect(() => {
    setVisibleCount((prev) => Math.min(Math.max(prev, safeInitial), list.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  const visibleItems = list.slice(0, Math.min(visibleCount, list.length));
  const hasMore = visibleCount < list.length;

  if (!list.length) return null;

  return (
    <section className={["mt-8", className].join(" ")}>
      <SectionHeader title={title} />

      <div className="mx-auto p-2">
        <ul role="list" className="flex flex-col gap-2">
          {visibleItems.map((a) => (
            <li key={a.id}>
              <RelatedArticleRow article={a} />
            </li>
          ))}
        </ul>

        {hasMore ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setVisibleCount((prev) => Math.min(prev + safeBatch, list.length))
              }
              className={[
                "px-3 py-2 text-sm font-semibold",
                "bg-[var(--color-surface)] border border-[var(--color-border)]",
                "hover:bg-[var(--color-surface-2,#f6f6f6)] transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]",
              ].join(" ")}
              aria-label="Cargar más artículos"
            >
              Cargar más
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
