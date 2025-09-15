import type { Company } from "@moto125/api-client";
import BrandCard from "./BrandCard";

export interface BrandGridProps {
  companies: Company[];
}

export default function BrandGrid({ companies }: BrandGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {companies.map((c) => (
        <BrandCard key={c.documentId} company={c} />
      ))}
    </div>
  );
}
