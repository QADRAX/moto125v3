import "server-only";
import type { Metadata } from "next";
import { getMirrorState } from "@/server/dataMirror";
import type { MirrorRootState } from "@moto125/data-mirror-core";
import ArticleGrid from "@/components/common/ArticleGrid";
import Pagination from "@/components/common/Pagination";
import { paginate } from "@/server/pagination";

export const revalidate = 60;

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Artículos",
  description: "Listado de artículos de moto125.cc",
};

export default async function ArticulosIndexPage() {
  const state: MirrorRootState = await getMirrorState();
  const all = state.data.articles ?? [];
  const { slice, info } = paginate(all, 1, PAGE_SIZE);

  return (
    <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="sr-only">Artículos</h1>
      <ArticleGrid articles={slice} allEmphasis />
      <Pagination baseHref="/articulos" page={info.page} totalPages={info.totalPages} />
    </section>
  );
}
