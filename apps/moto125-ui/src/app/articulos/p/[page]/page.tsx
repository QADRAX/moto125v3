import "server-only";

import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { getMirrorState } from "@/server/dataMirror";
import type { ContentCacheRootState } from "@moto125/content-cache-core";
import ArticleGrid from "@/components/common/ArticleGrid";
import Pagination from "@/components/common/Pagination";
import { paginate } from "@/server/pagination";
import { Container } from "@/components/common/Container";
import { PAGE_SIZE } from "@/constants";

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata(props: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;
  const pageNum = Number(params.page);
  const title = pageNum > 1 ? `Artículos (Página ${pageNum})` : "Artículos";
  const canonical = pageNum <= 1 ? "/articulos" : `/articulos/p/${pageNum}`;

  return {
    title,
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

export default async function ArticulosPagedPage(props: Props) {
  const params = await props.params;
  const pageNum = Number(params.page);
  if (!Number.isFinite(pageNum) || pageNum < 1) notFound();

  const state: ContentCacheRootState = await getMirrorState();
  const all = state.data.articles ?? [];
  const { slice, info } = paginate(all, pageNum, PAGE_SIZE);

  if (slice.length === 0 && pageNum > 1) notFound();

  return (
    <Container>
      <h1 className="sr-only">Artículos — Página {info.page}</h1>
      <ArticleGrid articles={slice} allEmphasis />
      <Pagination
        baseHref="/articulos"
        page={info.page}
        totalPages={info.totalPages}
      />
    </Container>
  );
}
