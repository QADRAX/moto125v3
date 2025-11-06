import * as React from "react";
import Link from "next/link";
import type { Article } from "@moto125/api-client";
import { mediaUrl, getThumbnailUrl } from "@/utils/utils";

export interface RelatedArticleRowProps {
  article: Article;
  className?: string;
  sizes?: string;
}

/**
 * Row layout (no padding, no rounded corners)
 * - Left: Thumbnail (fixed size)
 * - Right: Title + Type badge (non-link here) + Date (below)
 * - Importante: NO <a> dentro de <a> para evitar errores de hidratación.
 */
export default function RelatedArticleRow({
  article,
  className = "",
  sizes = "(min-width:1280px) 30vw, (min-width:1024px) 40vw, (min-width:640px) 60vw, 90vw",
}: RelatedArticleRowProps) {
  const href = `/${article.slug}`;

  const cover =
    (article.coverImage && getThumbnailUrl(article.coverImage)) ||
    (article.coverImage?.url ? mediaUrl(article.coverImage.url) : undefined);

  const title = article.title ?? "Artículo";

  // Prefer publicationDate; fallback to createdAt
  const rawDate = article.publicationDate ?? article.createdAt;
  const dateLabel =
    rawDate
      ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(
          new Date(rawDate)
        )
      : null;

  return (
    <Link
      href={href}
      className={[
        "group block",
        "hover:bg-[var(--color-surface-2,#fafafa)] transition-colors",
        className,
      ].join(" ")}
    >
      <div className="flex items-stretch gap-3">
        {/* Thumbnail (LEFT) */}
        <div className="relative shrink-0">
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="w-44 h-28 object-cover"
              loading="lazy"
              sizes={sizes}
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-44 h-28 bg-[var(--color-surface-2,#f3f3f3)]"
            />
          )}
        </div>

        {/* Title + Type Badge + Date (RIGHT) */}
        <div className="min-w-0 flex-1 self-center">
          <h3 className="text-base font-semibold leading-snug line-clamp-2">
            <span className="underline-offset-2 group-hover:underline">
              {title}
            </span>

            {/* Badge sin enlace para evitar <a> dentro de <a> */}
            {article.articleType?.name && (
              <span
                className={[
                  "inline-block bg-[var(--color-primary)] text-white text-[11px] font-bold uppercase",
                  "tracking-wide px-2 py-1 ml-2 align-middle",
                ].join(" ")}
              >
                {article.articleType.name}
              </span>
            )}
          </h3>

          {dateLabel && (
            <time
              dateTime={new Date(rawDate!).toISOString()}
              className="mt-1 block text-xs text-[var(--color-muted,#666)]"
            >
              {dateLabel}
            </time>
          )}
        </div>
      </div>
    </Link>
  );
}
