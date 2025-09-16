import { slugify } from "@/utils/utils";
import type { MotoClass } from "@moto125/api-client";
import Link from "next/link";


export interface ClassGridProps {
  /** Available moto classes (e.g., Scooter, Moto) */
  classes: MotoClass[];
}

/**
 * Grid of moto classes.
 */
export default function ClassGrid({ classes }: ClassGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {classes.map((c) => (
        <Link
          key={c.documentId}
          href={`/motos/${slugify(c.name)}`}
          className="border p-6 transition hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">{c.name}</h2>
          <p className="opacity-70">Explorar tipos</p>
        </Link>
      ))}
    </div>
  );
}
