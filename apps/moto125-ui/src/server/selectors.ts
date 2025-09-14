import "server-only";

import type { Article } from "@moto125/api-client";
import type { MirrorRootState } from "@moto125/data-mirror-core";

export function pickLatestArticles(state: MirrorRootState, limit = 10): Article[] {
  if (!state?.data?.articles?.length) return [];
  const items = state.data.articles.filter(a => a.visible !== false);

  const getDate = (a: Article) =>
    a.publicationDate ?? a.publishedAt ?? a.updatedAt ?? a.createdAt;

  return items
    .slice()
    .sort((a, b) => {
      const da = getDate(a);
      const db = getDate(b);
      const ta = da ? Date.parse(da) : 0;
      const tb = db ? Date.parse(db) : 0;
      return tb - ta;
    })
    .slice(0, limit);
}
