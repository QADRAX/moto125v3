import "server-only";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { getMirrorState } from "@/server/dataMirror";
import type { MirrorRootState } from "@moto125/data-mirror-core";
import ArticleGrid from "@/components/common/ArticleGrid";
import Pagination from "@/components/common/Pagination";
import { paginate } from "@/server/pagination";
import { slugify, toUpperCamelCase } from "@/utils/utils";

export const revalidate = 60;
const PAGE_SIZE = 12;

type Props = { params: { tipo: string; page: string } };

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const pageNum = Number(params.page);
  const human = toUpperCamelCase(params.tipo);
  return {
    title: `Artículos de ${human} (Página ${pageNum})`,
    alternates: {
      canonical:
        pageNum <= 1
          ? `/articulos/tipo/${params.tipo}`
          : `/articulos/tipo/${params.tipo}/p/${pageNum}`,
    },
  };
}

export default async function ArticulosTipoPagedPage({ params }: Props) {
  const pageNum = Number(params.page);
  if (!Number.isFinite(pageNum) || pageNum < 1) notFound();

  const state: MirrorRootState = await getMirrorState();
  const wanted = params.tipo.toLowerCase();
  const filtered = (state.data.articles ?? []).filter((a) => {
    const t = a.articleType?.name ?? "";
    return slugify(t) === wanted;
  });

  const { slice, info } = paginate(filtered, pageNum, PAGE_SIZE);
  if (slice.length === 0 && pageNum > 1) notFound();

  const human = toUpperCamelCase(params.tipo);

  return (
    <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="mb-4 text-2xl font-heading font-bold uppercase">
        {human} — Página {info.page}
      </h1>
      <ArticleGrid articles={slice} allEmphasis />
      <Pagination
        baseHref={`/articulos/tipo/${params.tipo}`}
        page={info.page}
        totalPages={info.totalPages}
      />
    </section>
  );
}
