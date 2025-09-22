import type { Moto } from "@moto125/api-client";
import MotoCard from "../motos/MotoCard";

export interface BrandMotoListProps {
  motos: Moto[];
}

export default function BrandMotoList({ motos }: BrandMotoListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {motos.map((m) => (
        <MotoCard key={m.documentId} moto={m} />
      ))}
    </div>
  );
}
