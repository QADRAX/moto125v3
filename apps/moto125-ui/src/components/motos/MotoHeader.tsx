import type { Moto } from "@moto125/api-client";
import { mediaUrl, slugify } from "@/utils/utils";
import Link from "next/link";

export interface MotoHeaderProps {
  moto: Moto;
}

export default function MotoHeader({ moto }: MotoHeaderProps) {
  const title = moto.fullName ?? moto.modelName;
  const img = moto.images?.[0]?.url ? mediaUrl(moto.images[0].url) : undefined;
  const company = moto.company;

  return (
    <header className="mb-6">
      <h1 className="text-3xl font-semibold leading-tight">{title}</h1>

      {company ? (
        <div className="mt-2 flex items-center gap-2">
          {company.image?.url ? (
            <Link href={`/marcas/${slugify(company.name)}`} className="shrink-0">
              <img
                src={mediaUrl(company.image.url)}
                alt={company.name}
                className="h-6 w-auto object-contain"
              />
            </Link>
          ) : null}

          <Link
            href={`/marcas/${slugify(company.name)}`}
            className="text-sm opacity-80 hover:underline"
          >
            {company.name}
          </Link>
        </div>
      ) : null}

      {img ? (
        <img
          src={img}
          alt={title}
          className="mt-4 w-full object-cover"
        />
      ) : null}

      {moto.description ? (
        <p className="mt-4 leading-relaxed">{moto.description}</p>
      ) : null}
    </header>
  );
}
