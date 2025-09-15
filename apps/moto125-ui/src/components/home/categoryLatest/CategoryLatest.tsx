import "server-only";
import Link from "next/link";
import { getMirrorState } from "@/server/dataMirror";
import { pickLatestArticles } from "@/server/selectors";
import type { Article } from "@moto125/api-client";
import { slugify } from "@/utils/utils";
import CategorySectionHeader from "./CategorySectionHeader";
import CategoryGrid from "./CategoryGrid";

/**
 * Server component: Latest N articles for a given category (article type).
 * @param articleType Category name or slug (e.g., "pruebas" or "pruebas-de-conduccion").
 * @param limit Max number of articles to show (default 8).
 * @param title Optional custom title for the section header.
 * @param containerClass Optional extra classes for the outer <section>.
 */
export default async function CategoryLatest(props: {
  articleType: string;
  limit?: number;
  title?: string;
  containerClass?: string;
  headerText: string;
}) {
  const { articleType, limit = 8, title, containerClass, headerText } = props;

  const state = await getMirrorState();
  if (!state) return null;

  const articles = pickLatestArticles(state, limit, articleType);

  const categorySlug = slugify(articleType);
  
  return (
    <section
      className={`mx-auto max-w-screen-xl px-4 sm:px-6 py-6 sm:py-8 ${containerClass ?? ""}`}
      aria-label={`Últimos de ${articleType}`}
    >
      <CategorySectionHeader
        title={headerText}
        action={
          <Link
            href={`/articulos/tipo/${categorySlug}`}
            className="hidden sm:inline-block text-sm font-heading uppercase text-[var(--color-primary)] hover:underline"
          >
            Ver más
          </Link>
        }
      />

      <CategoryGrid articles={articles} />
    </section>
  );
}
