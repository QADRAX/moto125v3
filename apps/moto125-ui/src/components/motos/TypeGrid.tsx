import "server-only";
import type { MotoType } from "@moto125/api-client";
import TypeCard from "./TypeCard";

export interface TypeGridProps {
  classSlug: string;
  types: MotoType[];
}

export default function TypeGrid({ classSlug, types }: TypeGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {types.map((t) => (
        <TypeCard key={t.documentId} type={t} classSlug={classSlug} />
      ))}
    </div>
  );
}
