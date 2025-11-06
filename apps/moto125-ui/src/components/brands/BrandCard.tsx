import "server-only";
import type { Company, Moto } from "@moto125/api-client";
import Link from "next/link";
import { mediaUrl, slugify } from "@/utils/utils";
import { getMirrorState } from "@/server/dataMirror";

export interface BrandCardProps {
  company: Company;
}

export default async function BrandCard({ company }: BrandCardProps) {
  const state = await getMirrorState();

  const count = state.data.motos.reduce((acc: number, m: Moto) => {
    return acc + (m.company?.documentId === company.documentId ? 1 : 0);
  }, 0);

  const img = company.image?.url ? mediaUrl(company.image.url) : undefined;
  const href = `/marcas/${slugify(company.name)}`;

  return (
    <Link
      href={href}
      className="group relative block w-full overflow-hidden rounded-2xl shadow-sm transition-transform
                 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      aria-label={`${company.name} — ${count} modelos`}
    >
      <div className="relative flex h-32 w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
        <span className="absolute left-3 top-3 select-none rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm z-50">
          {count === 0 ? "Sin modelos" : count === 1 ? "1 modelo" : `${count} modelos`}
        </span>

        {img ? (
          <img
            src={img}
            alt={company.name}
            loading="lazy"
            decoding="async"
            className="max-h-[70%] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="h-16 w-24 bg-neutral-200" />
        )}
      </div>

      <div className="p-4 text-center">
        <h3 className="text-base font-semibold tracking-tight">{company.name}</h3>
        {company.description ? (
          <p className="mt-1 text-sm opacity-70 line-clamp-2">{company.description}</p>
        ) : null}
      </div>
    </Link>
  );
}
