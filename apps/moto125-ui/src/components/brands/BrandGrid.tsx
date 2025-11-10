import "server-only";
import type { Company, Moto, Article } from "@moto125/api-client";
import { getMirrorState } from "@/server/dataMirror";
import BrandGridClient from "./BrandGridClient";

export interface BrandGridProps {
  companies: Company[];
}

export type CompanyWithMeta = Company & {
  motosCount: number;
  relevanceScore: number;
};

// Relevance rule:
// For each article related to a company, compute an age in days and add a contribution:
// contribution = 1 / (1 + ageDays / 30). Newer articles contribute more.
// The relevanceScore is the sum of contributions across related articles.

export default async function BrandGrid({ companies }: BrandGridProps) {
  const state = await getMirrorState();

  const motos: Moto[] = state.data.motos ?? [];
  const articles: Article[] = state.data.articles ?? [];

  const now = Date.now();

  const companiesWithMeta: CompanyWithMeta[] = companies.map((c) => {
    const motosCount = motos.reduce((acc: number, m: Moto) => {
      return acc + (m.active && m.company?.documentId === c.documentId ? 1 : 0);
    }, 0);

    // compute relevance from articles that reference this company
    let relevanceScore = 0;
    for (const a of articles) {
      const related = a.relatedCompanies?.some((rc) => rc?.documentId === c.documentId);
      if (related) {
        const dateStr = a.publicationDate ?? a.publishedAt ?? a.createdAt;
        const ts = dateStr ? new Date(dateStr).getTime() : 0;
        const ageDays = ts ? Math.max(0, (now - ts) / (1000 * 60 * 60 * 24)) : 365 * 10;
        const contribution = 1 / (1 + ageDays / 30);
        relevanceScore += contribution;
      }
    }

    return {
      ...c,
      motosCount,
      relevanceScore,
    };
  });

  // Ensure default ordering is by relevance (descending)
  companiesWithMeta.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return <BrandGridClient initialCompanies={companiesWithMeta} />;
}
