import Link from "next/link";
import React from "react";

type BrandSize = "sm" | "md" | "lg" | "xl";

const IMG_HEIGHTS: Record<BrandSize, string> = {
  sm: "h-6 sm:h-7",          // ~24 → 28 px
  md: "h-8 sm:h-9",          // ~32 → 36 px (default)
  lg: "h-10 sm:h-12",        // ~40 → 48 px
  xl: "h-12 sm:h-16",        // ~48 → 64 px
};

const TEXT_SIZES: Record<BrandSize, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

type Props = {
  siteName: string;
  logoUrl: string | null;
  alt?: string | null;
  size?: BrandSize;
  height?: number;
};

export default function HeaderBrand({
  siteName,
  logoUrl,
  alt,
  size = "xl",
  height,
}: Props) {
  const heightClass = height ? "" : IMG_HEIGHTS[size];
  const textSizeClass = TEXT_SIZES[size];

  return (
    <Link
      href="/"
      className="flex items-center gap-3 shrink-0"
      aria-label={siteName}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={alt ?? siteName}
          className={`${heightClass} w-auto block`}
          style={height ? { height, width: "auto" } : undefined}
          loading="eager"
          width={128}
          height={32}
        />
      ) : (
        <span className={`${textSizeClass} font-bold`}>{siteName}</span>
      )}
    </Link>
  );
}
