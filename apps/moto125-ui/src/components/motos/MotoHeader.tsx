import type { Moto } from "@moto125/api-client";
import { mediaUrl } from "@/utils/utils";

export interface MotoHeaderProps {
  moto: Moto;
}

export default function MotoHeader({ moto }: MotoHeaderProps) {
  const title = moto.fullName ?? moto.modelName;
  const img = moto.images?.[0]?.url ? mediaUrl(moto.images[0].url) : undefined;
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
      {moto.company?.name ? (
        <p className="mt-1 text-sm opacity-80">{moto.company.name}</p>
      ) : null}
      {img ? (
        <img src={img} alt={title} className="mt-4 w-full" />
      ) : null}
      {moto.description ? (
        <p className="mt-4 leading-relaxed">{moto.description}</p>
      ) : null}
    </header>
  );
}
