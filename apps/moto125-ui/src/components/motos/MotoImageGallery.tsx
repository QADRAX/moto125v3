"use client";

import type { Moto } from "@moto125/api-client";
import ZoomableImage from "@/components/common/ZoomableImage";
import { mediaUrl, getThumbnailUrl } from "@/utils/utils";
import SectionHeader from "../common/SectionHeader";

export default function MotoImageGallery({ moto }: { moto: Moto }) {
  const images = moto.images ?? [];
  if (!images.length) return null;

  return (
    <section className="mt-8">
      <SectionHeader title="Galería de fotos" />
      <ul
        role="list"
        className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]"
      >
        {images.map((img, i) => {
          if (!img?.url) return null;

          const src = mediaUrl(img.url);

          const alt =
            img.alternativeText ||
            `${moto.fullName ?? moto.modelName} — foto ${i + 1}`;

          return (
            <li key={img.id ?? `${img.url}-${i}`} className="relative">
              <ZoomableImage
                src={src}
                alt={alt}
                className="w-full h-40 sm:h-44 lg:h-48 object-cover shadow-sm"
                sizes="(min-width: 1280px) 20vw,
                 (min-width: 1024px) 25vw,
                 (min-width: 640px) 33vw,
                 50vw"
                draggable={false}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
