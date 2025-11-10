"use client";
import React, { useMemo, useState } from "react";
import type { Company } from "@moto125/api-client";
import BrandCardClient from "./BrandCardClient";
import FilterBar from "@/components/common/FilterBar";

export type CompanyWithMeta = Company & {
  motosCount: number;
  relevanceScore: number;
};

export interface BrandGridClientProps {
  initialCompanies: CompanyWithMeta[];
}

export default function BrandGridClient({
  initialCompanies,
}: BrandGridClientProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Keep server-provided order (relevance) and only filter by name
    if (!q) return initialCompanies;
    return initialCompanies.filter((c) =>
      (c.name ?? "").toLowerCase().includes(q)
    );
  }, [initialCompanies, query]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          placeholder="Buscar marcas..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((c) => (
          <BrandCardClient key={c.documentId} company={c} />
        ))}
      </div>
    </div>
  );
}
