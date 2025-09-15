import { slugify } from "@/utils/utils";
import type { MotoType } from "@moto125/api-client";
import Link from "next/link";

export interface TypeGridProps {
  classSlug: string;
  types: MotoType[];
}

/**
 * Grid of moto types for a selected class.
 */
export default function TypeGrid({ classSlug, types }: TypeGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {types.map((t) => (
        <Link
          key={t.documentId}
          href={`/motos/${classSlug}/${slugify(t.name ?? "")}`}
          className="rounded-2xl border p-6 transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold">{t.fullName ?? t.name}</h3>
          <p className="opacity-70">Ver motos</p>
        </Link>
      ))}
    </div>
  );
}
