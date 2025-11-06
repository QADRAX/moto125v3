import * as React from "react";
import Link from "next/link";
import type { Article } from "@moto125/api-client";
import { mediaUrl, getThumbnailUrl } from "@/utils/utils";
import ArticleTypeBadge from "@/components/common/ArticleTypeBadge";
import YouTubeLinkGA from "@/components/common/YouTubeLinkGA";

export interface RelatedArticleRowProps {
  article: Article;
  className?: string;
  sizes?: string;
}

/**
 * Row layout (no padding, no rounded corners)
 * - Left: Thumbnail (fixed size)
 * - Right: Title + Type badge + Date (below)
 * - Optional YouTube icon overlay on the image
 */
export default function RelatedArticleRow({
  article,
  className = "",
  sizes = "(min-width:1280px) 30vw, (min-width:1024px) 40vw, (min-width:640px) 60vw, 90vw",
}: RelatedArticleRowProps) {
  const href = `/articulos/${article.slug}`;
  const hasYT = Boolean(article.youtubeLink);

  const cover =
    (article.coverImage && getThumbnailUrl(article.coverImage)) ||
    (article.coverImage?.url ? mediaUrl(article.coverImage.url) : undefined);

  const title = article.title ?? "Artículo";

  // Prefer publicationDate; fallback to createdAt
  const rawDate = article.publicationDate ?? article.createdAt;
  const dateLabel =
    rawDate ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(rawDate)) : null;

  return (
    <Link
      href={href}
      className={[
        "group block",
        "hover:bg-[var(--color-surface-2,#fafafa)] transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]",
        className,
      ].join(" ")}
    >
      {/* Row: imagen IZQUIERDA + texto DERECHA */}
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
            <div aria-hidden="true" className="w-44 h-28 bg-[var(--color-surface-2,#f3f3f3)]" />
          )}

          {/* YouTube overlay */}
          {hasYT ? (
            <div className="absolute top-1 right-1">
              <YouTubeLinkGA
                href={article.youtubeLink!}
                ariaLabel="Abrir vídeo en YouTube"
                className="bg-black/70 text-white hover:bg-black/80"
                size={36}
                eventParams={{ source: "related_article_row", slug: article.slug }}
                as="a"
              />
            </div>
          ) : null}
        </div>

        {/* Title + Type Badge + Date (RIGHT) */}
        <div className="min-w-0 flex-1 self-center">
          <h3 className="text-base font-semibold leading-snug line-clamp-2">
            <span className="underline-offset-2 group-hover:underline">{title}</span>
            {article.articleType?.name && (
              <ArticleTypeBadge name={article.articleType.name} className="ml-2 align-middle" />
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
