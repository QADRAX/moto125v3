import { isExternalUrl } from "@/utils/utils";
import Link from "next/link";

type BannerSize = "sm" | "md" | "lg" | "xl";

const HEIGHTS: Record<BannerSize, string> = {
  sm: "h-16 sm:h-20",                // ~64 → 80px
  md: "h-24 sm:h-28 md:h-32",        // ~96 → 128px
  lg: "h-32 sm:h-40 md:h-48",        // ~128 → 192px (default)
  xl: "h-40 sm:h-52 md:h-64",        // ~160 → 256px
};

type Props = {
  imgUrl: string | null;
  title?: string | null;
  description?: string | null;
  linkUrl?: string | null;
  siteName: string;
  size?: BannerSize;
};

export default function HeaderHero({
  imgUrl,
  title,
  linkUrl,
  siteName,
  size = "md",
}: Props) {
  if (!imgUrl) return null;

  const tooltip = title ?? siteName;
  const heightClasses = HEIGHTS[size];

  const imgEl = (
    <img
      src={imgUrl}
      alt={tooltip}
      title={tooltip}
      className={`${heightClasses} w-auto rounded-lg border border-[#e6e6e6] object-contain bg-white block`}
      loading="lazy"
    />
  );

  if (!linkUrl) {
    return (
      <figure className="flex items-center gap-3 min-w-0">
        <div className="shrink-0">{imgEl}</div>
      </figure>
    );
  }

  const linkProps = {
    className:
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded-lg inline-block",
    title: tooltip,
    "aria-label": tooltip,
  } as const;

  return (
    <figure className="flex items-center gap-3 min-w-0">
      <div className="shrink-0">
        {isExternalUrl(linkUrl) ? (
          <a href={linkUrl} {...linkProps} rel="noopener noreferrer">
            {imgEl}
          </a>
        ) : (
          <Link href={linkUrl} {...linkProps}>
            {imgEl}
          </Link>
        )}
      </div>
    </figure>
  );
}
