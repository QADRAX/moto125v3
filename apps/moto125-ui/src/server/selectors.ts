import "server-only";

import type { Article } from "@moto125/api-client";
import type { ContentCacheRootState } from "@moto125/content-cache-core";
import { matchesType } from "@/utils/utils";

export function pickLatestArticles(
  state: ContentCacheRootState,
  limitOrType?: number | string,
  maybeType?: string
): Article[] {
  if (!state?.data?.articles?.length) return [];

  let limit = 10;
  let typeFilter: string | undefined = undefined;

  if (typeof limitOrType === "number") {
    limit = limitOrType ?? 10;
    typeFilter = maybeType;
  } else if (typeof limitOrType === "string") {
    typeFilter = limitOrType;
  }

  const items = state.data.articles.filter(
    (a) => a.visible !== false && matchesType(a, typeFilter)
  );

  const getDate = (a: Article) =>
    a.publicationDate ?? a.publishedAt ?? a.updatedAt ?? a.createdAt;

  return items
    .slice()
    .sort((a, b) => {
      const ta = getDate(a) ? Date.parse(getDate(a) as string) : 0;
      const tb = getDate(b) ? Date.parse(getDate(b) as string) : 0;
      return tb - ta;
    })
    .slice(0, limit);
}

export function pickArticleBySlug(
  state: ContentCacheRootState,
  slug: string
): Article | null {
  if (!state?.data?.articles?.length) return null;
  return (
    state.data.articles.find((a) => a.slug === slug && a.visible !== false) ??
    null
  );
}