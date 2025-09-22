import type { Moto } from "@moto125/api-client";
import MotoCard from "./MotoCard";

export interface MotoListProps {
  motos: Moto[];
}

export default function MotoList({
  motos,
}: MotoListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {motos.map((m) => (
        <MotoCard
          key={m.documentId}
          moto={m}
        />
      ))}
    </div>
  );
}
