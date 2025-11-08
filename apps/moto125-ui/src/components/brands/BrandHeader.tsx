import type { Company } from "@moto125/api-client";
import { mediaUrl } from "@/utils/utils";
import Markdown from "@/components/markdown/Markdown";

export interface BrandHeaderProps {
  company: Company;
}

function normalizeExternalUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;

  if (/^\/\//.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

export default function BrandHeader({ company }: BrandHeaderProps) {
  const img = company.image?.url ? mediaUrl(company.image.url) : undefined;
  const externalUrl = normalizeExternalUrl(company.url);

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

        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-sm underline break-all"
          >
            {company.url}
          </a>
        ) : null}

        {company.description ? (
          <div className="mt-2 max-w-3xl">
            <Markdown source={company.description} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
