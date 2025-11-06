"use client";

import * as React from "react";
import type { Moto, MotoType } from "@moto125/api-client";
import { mediaUrl, slugify } from "@/utils/utils";

export interface BrandMotoSection {
  label: string;
  icon?: string;
  href: string; // always required
  items: Moto[];
}

/** Best human-readable type label. */
function getTypeLabel(m: Moto): string {
  const mt = m.motoType ?? null;
  return (mt?.fullName ?? mt?.name ?? "Otros").trim();
}

/** Builds a lookup by motoType documentId -> MotoType. */
function buildMotoTypeIndex(
  motoTypes?: MotoType[] | null
): Map<string, MotoType> {
  const map = new Map<string, MotoType>();
  for (const t of motoTypes ?? []) {
    if (t?.documentId) map.set(t.documentId, t);
  }
  return map;
}

/** Sort: active first, then alphabetically. */
function sortMotosActiveFirst(a: Moto, b: Moto): number {
  if (a.active !== b.active) return a.active ? -1 : 1;
  return (a.fullName ?? a.modelName).localeCompare(
    b.fullName ?? b.modelName,
    "es",
    { sensitivity: "base" }
  );
}

/**
 * Extracted logic from BrandMotoList:
 * - Groups motos by type.
 * - Resolves icons and hrefs.
 * - Applies active filter and sorting.
 */
export function useBrandMotoListLogic(
  motos?: Moto[] | null,
  motoTypes?: MotoType[] | null,
  defaultActiveOnly = true
) {
  const list = React.useMemo(() => (motos ?? []).filter(Boolean), [motos]);
  const [activeOnly, setActiveOnly] =
    React.useState<boolean>(defaultActiveOnly);

  const typeIndex = React.useMemo(
    () => buildMotoTypeIndex(motoTypes),
    [motoTypes]
  );

  const sections: BrandMotoSection[] = React.useMemo(() => {
    const filtered = activeOnly ? list.filter((m) => m.active) : list;
    if (!filtered.length) return [];

    const groupsMap = new Map<
      string,
      { label: string; icon?: string; href: string; items: Moto[] }
    >();

    for (const m of filtered) {
      const typeId = m.motoType?.documentId ?? "__otros__";
      const label = getTypeLabel(m);

      // Prefer data from taxonomy
      const t = typeIndex.get(typeId);
      const classNameFromIndex = t?.motoClass?.name;
      const typeNameFromIndex = t?.name ?? t?.fullName;

      // Fallback to moto object
      const classNameFromMoto = m.motoType?.motoClass?.name;
      const typeNameFromMoto = m.motoType?.name ?? m.motoType?.fullName;

      const cls = classNameFromIndex ?? classNameFromMoto;
      const tname = typeNameFromIndex ?? typeNameFromMoto;

      if (!cls || !tname) continue;

      const href = `/motos/${slugify(cls)}/${slugify(tname)}`;
      const iconUrl = t?.image?.url ?? m.motoType?.image?.url ?? undefined;
      const icon = iconUrl ? mediaUrl(iconUrl) : undefined;

      const existing = groupsMap.get(typeId);
      if (existing) {
        existing.items.push(m);
        if (!existing.icon && icon) existing.icon = icon;
      } else {
        groupsMap.set(typeId, { label, icon, href, items: [m] });
      }
    }

    return Array.from(groupsMap.values())
      .map((s) => ({
        ...s,
        items: s.items.slice().sort(sortMotosActiveFirst),
      }))
      .filter((s) => s.items.length > 0)
      .sort((a, b) =>
        a.label.localeCompare(b.label, "es", { sensitivity: "base" })
      );
  }, [activeOnly, list, typeIndex]);

  return {
    activeOnly,
    setActiveOnly,
    sections,
    hasData: sections.length > 0,
  };
}
