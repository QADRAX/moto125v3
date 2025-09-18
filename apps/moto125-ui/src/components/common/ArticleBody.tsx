import "server-only";
import Link from "next/link";
import type { Article } from "@moto125/api-client";
import { formatDate, resolveArticleHref } from "@/utils/utils";

export default function ArticleBody({
  article,
  emphasis,
}: {
  article: Article;
  emphasis: boolean;
}) {
  const href = resolveArticleHref(article);
  const date = article.publicationDate ?? article.publishedAt ?? null;

  const meta: { label: string; value: string }[] = [];
  if (article.authorText)
    meta.push({ label: "Autor del texto", value: article.authorText });
  if (article.authorPhotos)
    meta.push({ label: "Autor de fotos", value: article.authorPhotos });
  if (article.authorAction)
    meta.push({ label: "Autor de acción", value: article.authorAction });

  return (
    <div className="p-1 flex flex-col flex-1">
      {/* Fecha */}
      {date && <p className="m-0 text-xs text-[#666]">{formatDate(date)}</p>}

      {/* Título */}
      <h3
        className={`mt-1 mb-2 font-heading font-bold uppercase leading-tight
        ${emphasis ? "text-2xl" : "text-lg"} line-clamp-2`}
      >
        <Link
          href={href}
          className="focus:outline-none focus-primary hover-primary"
        >
          {article.title ?? "Artículo"}
        </Link>
      </h3>

      {emphasis && meta.length > 0 && (
        <p className="mt-auto text-sm whitespace-nowrap overflow-hidden text-ellipsis">
          {meta.map((m, i) => (
            <span key={m.label} className="text-[#444]">
              <span className="text-[#666] font-medium">{m.label}:</span>{" "}
              {m.value}
              {i < meta.length - 1 && (
                <span className="mx-2 text-[#999]">·</span>
              )}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
