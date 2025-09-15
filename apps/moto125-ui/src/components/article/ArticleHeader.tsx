import type { Article } from "@moto125/api-client";
import { mediaUrl } from "@/utils/utils";

export interface ArticleHeaderProps {
  article: Article;
}

function getBestDate(a: Article): string | undefined {
  return a.publicationDate || a.publishedAt || a.updatedAt || a.createdAt;
}

export default function ArticleHeader({ article }: ArticleHeaderProps) {
  const isoDate = getBestDate(article);
  const displayDate = isoDate
    ? new Date(isoDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined;

  const coverUrl = mediaUrl(article.coverImage.url);

  return (
    <header className="mb-6">
      <h1 className="text-3xl font-semibold leading-tight">
        {article.title ?? article.slug}
      </h1>
      {displayDate && (
        <time dateTime={isoDate} className="mt-2 block text-sm opacity-70">
          {displayDate}
        </time>
      )}
      {article.authorText && (
        <p className="mt-2 text-sm opacity-80">{article.authorText}</p>
      )}
      {coverUrl && (
        <img
          src={coverUrl}
          alt={article.title ?? article.slug}
          className="mt-4 w-full rounded-2xl"
        />
      )}
    </header>
  );
}
