import "server-only";
import Link from "next/link";
import type { Article } from "@moto125/api-client";
import { getImage, resolveArticleHref } from "@/utils/utils";

export default function ArticleImage({
  article,
  emphasis,
}: {
  article: Article;
  emphasis: boolean;
}) {
  const img = getImage(article);
  const href = resolveArticleHref(article);

  // Heights: larger for emphasized cards
  const height = emphasis
    ? "clamp(220px, 34vw, 360px)"
    : "clamp(160px, 22vw, 240px)";

  return (
    <Link href={href} aria-label={article.title ?? "Ver artículo"}>
      <div className="relative w-full overflow-hidden" style={{ height }}>
        {img.url ? (
          <img
            src={img.url}
            alt={img.alt}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading={emphasis ? "eager" : "lazy"}
          />
        ) : (
          <div className="h-full w-full bg-[#eee]" />
        )}
      </div>
    </Link>
  );
}
