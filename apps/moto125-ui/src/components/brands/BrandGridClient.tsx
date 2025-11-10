"use client";
import React, { useMemo, useState } from "react";
import type { Company } from "@moto125/api-client";
import BrandCardClient from "./BrandCardClient";

export type CompanyWithMeta = Company & {
  motosCount: number;
  relevanceScore: number;
};

export interface BrandGridClientProps {
  initialCompanies: CompanyWithMeta[];
}

export default function BrandGridClient({ initialCompanies }: BrandGridClientProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Keep server-provided order (relevance) and only filter by name
    if (!q) return initialCompanies;
    return initialCompanies.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [initialCompanies, query]);

  return (
    <div>
      <div className="mb-4">
        <input
          aria-label="Buscar marcas"
          placeholder="Buscar marcas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
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
