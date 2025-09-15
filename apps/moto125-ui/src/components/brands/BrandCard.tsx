import type { Company } from "@moto125/api-client";
import Link from "next/link";
import { mediaUrl, slugify } from "@/utils/utils";

export interface BrandCardProps {
  company: Company;
}

export default function BrandCard({ company }: BrandCardProps) {
  const img = company.image?.url ? mediaUrl(company.image.url) : undefined;
  const href = `/marcas/${slugify(company.name)}`;
  return (
    <Link
      href={href}
      className="rounded-2xl border p-4 transition hover:shadow-md"
    >
      <div className="flex flex-col items-center text-center">
        {img ? (
          <img
            src={img}
            alt={company.name}
            className="mb-3 h-20 w-auto object-contain"
          />
        ) : (
          <div className="mb-3 h-20 w-full rounded-xl bg-neutral-100" />
        )}
        <h3 className="text-base font-semibold">{company.name}</h3>
      </div>
    </Link>
  );
}
