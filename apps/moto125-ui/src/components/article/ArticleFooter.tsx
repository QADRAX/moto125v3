import type { Article, Company, Moto } from "@moto125/api-client";
import MotoCard from "../motos/MotoCard";
import BrandCard from "../brands/BrandCard";

export interface ArticleFooterProps {
  article: Article;
}

export default function ArticleFooter({ article }: ArticleFooterProps) {
  const motos = (article.relatedMotos ?? []) as Moto[];
  const companies = (article.relatedCompanies ?? []) as Company[];
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

      {motos.length ? (
        <section>
          <h3 className="mb-3 text-lg font-semibold tracking-tight">
            Motos relacionadas
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {motos.map((m) => (
              <MotoCard key={m.id} moto={m} />
            ))}
          </div>
        </section>
      ) : null}

      {companies.length ? (
        <section>
          <h3 className="mb-3 text-lg font-semibold tracking-tight">
            Marcas relacionadas
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <BrandCard key={c.id} company={c} />
            ))}
          </div>
        </section>
      ) : null}
    </footer>
  );
}
