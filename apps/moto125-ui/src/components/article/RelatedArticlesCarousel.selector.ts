import type { Article } from "@moto125/api-client";

/**
 * Picks related articles for a given article using shared tags and recency.
 *
 * Strategy:
 * 1) Pool = all visible articles except the current one.
 * 2) Primary = Pool with ≥1 shared tag (case-insensitive), sorted by newest.
 * 3) If Primary < minItems, fill with newest from Pool (without duplicates) until minItems.
 */
export function selectRelatedArticles(
  all: Article[],
  current: Article,
  minItems: number,
  maxItems: number
): Article[] {
  const currentId = current.id;
  const currentTags = new Set(
    (current.tags ?? [])
      .map((t) => (t.Value ?? "").trim().toLowerCase())
      .filter(Boolean)
  );

  const pool = all.filter((a) => a.id !== currentId && a.visible);

  const getDate = (a: Article): number => {
    const d =
      a.publicationDate ?? a.publishedAt ?? a.createdAt ?? a.updatedAt ?? "";
    return d ? new Date(d).getTime() : 0;
  };

  const withSharedTags = pool.filter((a) => {
    if (!currentTags.size) return false;
    const tags = (a.tags ?? [])
      .map((t) => (t.Value ?? "").trim().toLowerCase())
      .filter(Boolean);
    return tags.some((t) => currentTags.has(t));
  });

  withSharedTags.sort((a, b) => getDate(b) - getDate(a));

  const picked: Article[] = [];
  const used = new Set<number>();

  for (const a of withSharedTags) {
    if (picked.length >= maxItems) break;
    picked.push(a);
    used.add(a.id);
  }

  if (picked.length < Math.max(0, minItems)) {
    const remaining = pool
      .filter((a) => !used.has(a.id))
      .sort((a, b) => getDate(b) - getDate(a));

    for (const a of remaining) {
      if (picked.length >= Math.max(minItems, Math.min(maxItems, minItems)))
        break;
      if (picked.length >= maxItems) break;
      picked.push(a);
      used.add(a.id);
    }
  }

  return picked.slice(0, maxItems);
}
