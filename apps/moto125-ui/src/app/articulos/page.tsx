import "server-only";
import type { Metadata } from "next";
import { getMirrorState } from "@/server/dataMirror";
import type { MirrorRootState } from "@moto125/content-cache-core";
import ArticleGrid from "@/components/common/ArticleGrid";
import Pagination from "@/components/common/Pagination";
import { paginate } from "@/server/pagination";
import { Container } from "@/components/common/Container";
import { PAGE_SIZE } from "@/constants";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Artículos",
  description: "Listado de artículos de moto125.cc",
  alternates: { canonical: "/articulos" }
};

export default async function ArticulosIndexPage() {
  const state: MirrorRootState = await getMirrorState();
  const all = state.data.articles ?? [];
  const { slice, info } = paginate(all, 1, PAGE_SIZE);

  return (
    <Container>
      <h1 className="mb-4 text-2xl font-heading font-bold uppercase">
        Artículos
      </h1>
      <ArticleGrid articles={slice} allEmphasis />
      <Pagination baseHref="/articulos" page={info.page} totalPages={info.totalPages} />
    </Container>
  );
}
