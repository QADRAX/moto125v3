import type { Moto } from "@moto125/api-client";
import Link from "next/link";
import { mediaUrl } from "@/utils/utils";

export interface MotoCardProps {
  moto: Moto;
}

export default function MotoCard({ moto }: MotoCardProps) {
  const img = moto.images?.[0]?.url ? mediaUrl(moto.images[0].url) : undefined;
  const title = moto.fullName ?? moto.modelName;
  return (
    <Link
      href={`/moto/${moto.moto125Id}`}
      className="border p-4 transition hover:shadow-md"
    >
      {img ? (
        <img
          src={img}
          alt={title}
          className="mb-3 aspect-video w-full object-cover"
        />
      ) : (
        <div className="mb-3 aspect-video w-full bg-neutral-100" />
      )}
      <h4 className="text-base font-semibold">{title}</h4>
      {moto.company?.name ? (
        <p className="text-sm opacity-70">{moto.company.name}</p>
      ) : null}
    </Link>
  );
}
