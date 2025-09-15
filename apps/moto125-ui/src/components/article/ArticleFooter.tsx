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
            <span
              key={t.id}
              className="rounded-full bg-neutral-100 px-3 py-1 text-xs"
            >
              {t.Value ?? "#tag"}
            </span>
          ))}
        </div>
      ) : null}

      {article.relatedMotos?.length ? (
        <div>
          <h3 className="mb-2 text-lg font-medium">Motos relacionadas</h3>
          <ul className="list-disc pl-5">
            {article.relatedMotos.map((m) => (
              <li key={m.id}>{m.fullName ?? m.modelName}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {article.relatedCompanies?.length ? (
        <div>
          <h3 className="mb-2 text-lg font-medium">Marcas relacionadas</h3>
          <ul className="list-disc pl-5">
            {article.relatedCompanies.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </footer>
  );
}
