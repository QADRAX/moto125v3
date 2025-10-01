import type { Article } from "@moto125/api-client";

export interface ArticleFooterProps {
  article: Article;
}

export default function ArticleFooter({ article }: ArticleFooterProps) {
  return (
    <footer className="mt-10 space-y-4">
      {article.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {article.tags.map((t) => (
            <span key={t.id} className="bg-neutral-100 px-3 py-1 text-xs">
              {t.Value ?? "#tag"}
            </span>
          ))}
        </div>
      ) : null}
    </footer>
  );
}
