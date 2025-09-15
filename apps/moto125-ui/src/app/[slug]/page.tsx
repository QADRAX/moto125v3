import "server-only";

import { notFound } from "next/navigation";
import type { MirrorRootState } from "@moto125/data-mirror-core";
import { pickArticleBySlug } from "@/server/selectors";
import { getMirrorState } from "@/server/dataMirror";
import { mediaUrl } from "@/utils/utils";
import ArticleView from "@/components/article/ArticleView";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const state = await getMirrorState();
  const article = pickArticleBySlug(state, params.slug);
  if (!article) return { title: "Artículo no encontrado" };

  const title = article.title || article.slug;
  const description = article.authorText || undefined;
  const cover = mediaUrl(article.coverImage.url);

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const state: MirrorRootState = await getMirrorState();
  const article = pickArticleBySlug(state, params.slug);
  if (!article) notFound();

  return <ArticleView article={article} />;
}
