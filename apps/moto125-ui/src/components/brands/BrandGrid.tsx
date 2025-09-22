import "server-only";
import type { Company, Moto } from "@moto125/api-client";
import BrandCard from "./BrandCard";
import { getMirrorState } from "@/server/dataMirror";

export interface BrandGridProps {
  companies: Company[];
}

export default async function BrandGrid({ companies }: BrandGridProps) {
  const state = await getMirrorState();

  const motoCounts = new Map<string, number>();
  for (const c of companies) {
    const count = state.data.motos.reduce((acc: number, m: Moto) => {
      return acc + (m.company?.documentId === c.documentId ? 1 : 0);
    }, 0);
    motoCounts.set(c.documentId, count);
  }

  const sorted = [...companies].sort((a, b) => {
    const countA = motoCounts.get(a.documentId) ?? 0;
    const countB = motoCounts.get(b.documentId) ?? 0;
    return countB - countA;
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {sorted.map((c) => (
        <BrandCard key={c.documentId} company={c} />
      ))}
    </div>
  );
}
