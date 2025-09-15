import type { Moto } from "@moto125/api-client";
import Link from "next/link";
import { mediaUrl, slugify } from "@/utils/utils";

export interface BrandMotoCardProps {
  moto: Moto;
}

function getMotoCanonicalPath(m: Moto): string {
  const typeSlug = m.motoType ? slugify(m.motoType.name ?? "") : "";
  const classSlug = m.motoType?.motoClass
    ? slugify(m.motoType.motoClass.name)
    : "";
  if (typeSlug && classSlug)
    return `/motos/${classSlug}/${typeSlug}/${m.moto125Id}`;
  return `/motos/${m.moto125Id}`;
}

export default function BrandMotoCard({ moto }: BrandMotoCardProps) {
  const img = moto.images?.[0]?.url ? mediaUrl(moto.images[0].url) : undefined;
  const title = moto.fullName ?? moto.modelName;
  const href = getMotoCanonicalPath(moto);
  return (
    <Link
      href={href}
      className="rounded-2xl border p-4 transition hover:shadow-md"
    >
      {img ? (
        <img
          src={img}
          alt={title}
          className="mb-3 aspect-video w-full rounded-xl object-cover"
        />
      ) : (
        <div className="mb-3 aspect-video w-full rounded-xl bg-neutral-100" />
      )}
      <h4 className="text-base font-semibold">{title}</h4>
      {moto.company?.name ? (
        <p className="text-sm opacity-70">{moto.company.name}</p>
      ) : null}
    </Link>
  );
}
