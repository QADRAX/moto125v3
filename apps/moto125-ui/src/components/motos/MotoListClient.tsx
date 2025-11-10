"use client";

import React, { useMemo, useState } from "react";
import type { Moto } from "@moto125/api-client";
import MotoCard from "./MotoCard";
import FilterBar from "@/components/common/FilterBar";

export type MotoWithMeta = Moto & { relevanceScore?: number };

export interface MotoListClientProps {
  initialMotos: MotoWithMeta[];
}

export default function MotoListClient({ initialMotos }: MotoListClientProps) {
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  const anyActive = useMemo(() => initialMotos.some((m) => m.active), [initialMotos]);
  const anyInactive = useMemo(() => initialMotos.some((m) => !m.active), [initialMotos]);
  const activeToggleDisabled = !(anyActive && anyInactive);

  React.useEffect(() => {
    // If only inactive motos exist, show them (disable toggle and set to false)
    if (!anyActive && anyInactive) {
      setActiveOnly(false);
      return;
    }

    // If only active motos exist, keep activeOnly true but disable toggle
    if (anyActive && !anyInactive) {
      setActiveOnly(true);
      return;
    }

    // If both exist, default to activeOnly true and enable toggle
    setActiveOnly(true);
  }, [anyActive, anyInactive]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = initialMotos.slice();

    if (activeOnly) {
      list = list.filter((m) => m.active);
    }

    if (q) {
      list = list.filter((m) =>
        (m.fullName ?? m.modelName ?? "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [initialMotos, query, activeOnly]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          placeholder="Buscar por modelo..."
          showActiveToggle
          activeOnly={activeOnly}
          onActiveOnlyChange={setActiveOnly}
          activeToggleDisabled={activeToggleDisabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((m) => (
          <MotoCard key={m.documentId} moto={m} />
        ))}
      </div>
    </div>
  );
}
