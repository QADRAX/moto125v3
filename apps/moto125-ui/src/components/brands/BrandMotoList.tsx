import type { Moto } from "@moto125/api-client";
import BrandMotoCard from "./BrandMotoCard";

export interface BrandMotoListProps {
  motos: Moto[];
}

export default function BrandMotoList({ motos }: BrandMotoListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {motos.map((m) => (
        <BrandMotoCard key={m.documentId} moto={m} />
      ))}
    </div>
  );
}
