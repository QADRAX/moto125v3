import "server-only";
import Link from "next/link";
import type { MotoClass, StrapiFile, Moto } from "@moto125/api-client";
import { mediaUrl, slugify } from "@/utils/utils";
import { getMirrorState } from "@/server/dataMirror";

export default async function ClassCard({ clazz }: { clazz: MotoClass }) {
  const state = await getMirrorState();

  const count = state.data.motos.reduce((acc: number, m: Moto) => {
    const classId = m.motoType?.motoClass?.documentId;
    return acc + (classId === clazz.documentId ? 1 : 0);
  }, 0);

  const href = `/motos/${slugify(clazz.name)}`;
  const imgSrc = mediaUrl(clazz.image?.url);

  return (
    <Link
      href={href}
      className="group relative block w-full overflow-hidden rounded-2xl shadow-sm transition-transform
                 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      aria-label={`${clazz.name} — ${renderCount(count)}`}
    >
      <div className="relative w-full aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <span className="absolute left-3 top-3 select-none rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {renderCount(count)}
        </span>

        <img
          src={imgSrc}
          alt={clazz.name}
          loading="lazy"
          decoding="async"
          className="max-h-[78%] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.04] drop-shadow-md"
        />
      </div>

      <div className="p-4">
        <h2 className="text-lg font-semibold tracking-tight">{clazz.name}</h2>
        <p className="mt-0.5 text-sm opacity-70">Explorar tipos</p>
      </div>
    </Link>
  );
}

function renderCount(n?: number): string {
  if (typeof n !== "number") return "Explorar modelos";
  if (n === 0) return "Sin modelos";
  if (n === 1) return "1 modelo";
  return `${n} modelos`;
}
