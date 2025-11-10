import type { Moto } from "@moto125/api-client";
import MotoListClient from "./MotoListClient";

export interface MotoListProps {
  motos: Moto[];
}

export default function MotoList({ motos }: MotoListProps) {
  const now = Date.now();

  const enriched = motos.map((m) => {
    const relatedArticles =
      (m as any).relatedArticles ?? (m as any).articles ?? [];
    let relevanceScore = 0;

    for (const a of relatedArticles ?? []) {
      const dateStr = a?.publicationDate ?? a?.publishedAt ?? a?.createdAt;
      const ts = dateStr ? new Date(dateStr).getTime() : 0;
      const ageDays = ts
        ? Math.max(0, (now - ts) / (1000 * 60 * 60 * 24))
        : 365 * 10;
      const contribution = 1 / (1 + ageDays / 30);
      relevanceScore += contribution;
    }

    return {
      ...m,
      relevanceScore,
    } as Moto & { relevanceScore: number };
  });

  // Default ordering is by relevance desc
  enriched.sort(
    (a, b) => (b as any).relevanceScore - (a as any).relevanceScore
  );

  return <MotoListClient initialMotos={enriched} />;
}
