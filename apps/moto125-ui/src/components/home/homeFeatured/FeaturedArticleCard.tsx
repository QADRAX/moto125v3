import "server-only";
import Link from "next/link";
import type { Article } from "@moto125/api-client";
import { formatDate, getImage, resolveArticleHref } from "@/utils/utils";
import YouTubeLinkGA from "@/components/common/YouTubeLinkGA";

type Variant = "hero" | "small";

type Props = {
  article: Article;
  variant: Variant;
  height?: string;
  maxHeight?: string;
};

const COMMON = {
  borderClass: "border border-[var(--color-border)]",
  darkenHoverGradient:
    "linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.45) 100%)",
} as const;

const PRESET = {
  hero: {
    overlayPadding: "p-4 sm:p-6",
    titleClass:
      "font-heading font-bold text-white text-2xl sm:text-3xl md:text-4xl leading-tight uppercase line-clamp-2 drop-shadow",
    badgeClass:
      "inline-block bg-[var(--color-primary)] text-white text-xs font-bold uppercase tracking-wide px-2 py-1 mb-2 ml-2",
    dateClass: "text-white/85 text-sm",
    height: "clamp(260px, 45vw, 600px)",
    maxHeight: "70vh",
    gradient:
      "linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.75) 100%)",
  },
  small: {
    overlayPadding: "p-3 sm:p-4",
    titleClass:
      "font-heading font-bold text-white text-xl sm:text-xl leading-snug uppercase line-clamp-2",
    badgeClass:
      "inline-block bg-[var(--color-primary)] text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-0.5 ml-2",
    dateClass: "text-white/85 text-xs",
    height: "clamp(200px, 32vw, 360px)",
    maxHeight: "45vh",
    gradient:
      "linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.80) 100%)",
  },
} as const;

export default function FeaturedArticleCard({
  article,
  variant,
  height,
  maxHeight,
}: Props) {
  const img = getImage(article);
  const href = resolveArticleHref(article);
  const P = PRESET[variant];

  const bgImageStyle: React.CSSProperties | undefined = img.url
    ? {
        backgroundImage: `url(${img.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : undefined;

  return (
    <article className={`relative w-full overflow-hidden ${COMMON.borderClass}`}>
      <Link
        href={href}
        className="group relative block hover-primary focus-primary"
        aria-label={article.title ?? "Ver artículo"}
        style={{
          height: height ?? P.height,
          maxHeight: maxHeight ?? P.maxHeight,
          ...bgImageStyle,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-in-out opacity-90"
          style={{ background: P.gradient }}
        />

        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
          style={{ background: COMMON.darkenHoverGradient }}
        />

        <span className="sr-only">{img.alt}</span>

        <div
          className={`absolute inset-x-0 bottom-0 ${P.overlayPadding} transform-gpu transition-transform duration-300 ease-out group-hover:translate-x-1 sm:group-hover:translate-x-2`}
        >
          {variant === "hero" ? (
            <h2 className={`m-0 ${P.titleClass} hover-primary focus-primary`}>
              {article.title ?? "Artículo"}
            </h2>
          ) : (
            <h3 className={`m-0 ${P.titleClass} hover-primary focus-primary`}>
              {article.title ?? "Artículo"}
            </h3>
          )}

          {(article.publicationDate ?? article.publishedAt) && (
            <p className={`mt-1 flex items-center ${P.dateClass}`}>
              {formatDate(article.publicationDate ?? article.publishedAt)}

              {article.youtubeLink && (
                <YouTubeLinkGA href={article.youtubeLink}/>
              )}

              {article.articleType?.name && (
                <span className={P.badgeClass}>{article.articleType.name}</span>
              )}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
