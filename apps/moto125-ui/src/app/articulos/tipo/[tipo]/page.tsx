import "server-only";
import type { Metadata, ResolvingMetadata } from "next";
import { getMirrorState } from "@/server/dataMirror";
import type { MirrorRootState } from "@moto125/data-mirror-core";
import ArticleGrid from "@/components/common/ArticleGrid";
import Pagination from "@/components/common/Pagination";
import { paginate } from "@/server/pagination";
import { slugify, toUpperCamelCase } from "@/utils/utils";
import { Container } from "@/components/common/Container";

export const revalidate = 60;
const PAGE_SIZE = 12;

type Props = { params: { tipo: string } };

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const human = toUpperCamelCase(params.tipo);
  return {
    title: `Artículos de ${human}`,
    alternates: { canonical: `/articulos/tipo/${params.tipo}` },
  };
}

export default async function ArticulosTipoIndexPage({ params }: Props) {
  const state: MirrorRootState = await getMirrorState();
  const wanted = params.tipo.toLowerCase();

  const all = (state.data.articles ?? []).filter((a) => {
    const t = a.articleType?.name ?? "";
    return slugify(t) === wanted;
  });

  const { slice, info } = paginate(all, 1, PAGE_SIZE);
  const human = toUpperCamelCase(params.tipo);

  return (
    <Container>
      <h1 className="mb-4 text-2xl font-heading font-bold uppercase">
        {human}
      </h1>
      <ArticleGrid articles={slice} allEmphasis />
      <Pagination
        baseHref={`/articulos/tipo/${params.tipo}`}
        page={info.page}
        totalPages={info.totalPages}
      />
    </Container>
  );
}
