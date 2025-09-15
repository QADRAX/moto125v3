import type { Company } from "@moto125/api-client";
import { mediaUrl } from "@/utils/utils";

export interface BrandHeaderProps {
  company: Company;
}

export default function BrandHeader({ company }: BrandHeaderProps) {
  const img = company.image?.url ? mediaUrl(company.image.url) : undefined;
  return (
    <header className="mb-2 flex items-center gap-4">
      {img ? (
        <img
          src={img}
          alt={company.name}
          className="h-14 w-auto object-contain"
        />
      ) : null}
      <div>
        <h1 className="text-3xl font-semibold leading-tight">{company.name}</h1>
        {company.url ? (
          <a
            href={company.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            {company.url}
          </a>
        ) : null}
        {company.description ? (
          <p className="mt-2 max-w-3xl leading-relaxed">
            {company.description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
