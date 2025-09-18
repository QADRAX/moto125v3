import "server-only";

import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { getMirrorState } from "@/server/dataMirror";
import type { MirrorRootState } from "@moto125/data-mirror-core";
import ArticleGrid from "@/components/common/ArticleGrid";
import Pagination from "@/components/common/Pagination";
import { paginate } from "@/server/pagination";

export const revalidate = 60;
const PAGE_SIZE = 12;

type Props = { params: { page: string } };

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const pageNum = Number(params.page);
  const title = pageNum > 1 ? `Artículos (Página ${pageNum})` : "Artículos";
  const canonical = pageNum <= 1 ? "/articulos" : `/articulos/p/${pageNum}`;

  return {
    title,
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

export default async function ArticulosPagedPage({ params }: Props) {
  const pageNum = Number(params.page);
  if (!Number.isFinite(pageNum) || pageNum < 1) notFound();

  const state: MirrorRootState = await getMirrorState();
  const all = state.data.articles ?? [];
  const { slice, info } = paginate(all, pageNum, PAGE_SIZE);

  if (slice.length === 0 && pageNum > 1) notFound();

  return (
    <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="sr-only">Artículos — Página {info.page}</h1>
      <ArticleGrid articles={slice} allEmphasis />
      <Pagination
        baseHref="/articulos"
        page={info.page}
        totalPages={info.totalPages}
      />
    </section>
  );
}
