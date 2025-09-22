import type { Moto } from "@moto125/api-client";
import Link from "next/link";
import { mediaUrl } from "@/utils/utils";

function formatNormativa(n?: Moto["normativa"] | null): string {
  if (!n) return "Sin datos";
  return n === "Euro 5plus" ? "Euro 5+" : n;
}

function getMotoImage(moto: Moto): string | undefined {
  const raw = moto.images?.[0]?.url;
  return raw ? mediaUrl(raw) : undefined;
}

export interface MotoCardProps {
  moto: Moto;
}

export default function MotoCard({ moto }: MotoCardProps) {
  const img = getMotoImage(moto);
  const title = moto.fullName ?? moto.modelName;
  const company = moto.company?.name;
  const normativa = formatNormativa(moto.normativa);

  return (
    <Link
      href={`/moto/${moto.moto125Id}`}
      className="group relative block w-full overflow-hidden rounded-2xl shadow-sm transition-transform
                 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      aria-label={`${title}${company ? ` — ${company}` : ""}`}
    >
      <div className="relative aspect-video w-full bg-neutral-100 dark:bg-neutral-800">
        {img ? (
          <img
            src={img}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : null}

        {moto.active ? (
          <span className="absolute left-3 top-3 select-none rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400 align-middle" />
            En tiendas
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <h4 className="text-base font-semibold leading-snug line-clamp-2">
          {title}
        </h4>
        {company ? (
          <p className="mt-0.5 text-sm opacity-70">{company}</p>
        ) : null}

        <div className="mt-3">
          <span className="inline-flex items-center rounded-full border border-black/10 px-2.5 py-1 text-xs font-medium
                           text-black/80 dark:text-white/80 dark:border-white/10">
            {normativa}
          </span>
        </div>
      </div>
    </Link>
  );
}
