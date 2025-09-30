import type { Article } from "@moto125/api-client";
import { getImage } from "@/utils/utils";
import SeoDate from "../common/SeoDate";
import ArticleTypeBadge from "../common/ArticleTypeBadge";
import YouTubeLinkGA from "../common/YouTubeLinkGA";

export interface ArticleHeaderProps {
  article: Article;
}

function getBestDateISO(a: Article): string | undefined {
  return a.publicationDate || a.publishedAt || a.updatedAt || a.createdAt;
}

export default function ArticleHeader({ article }: ArticleHeaderProps) {
  const iso = getBestDateISO(article);
  const { url: bgUrl, alt } = getImage(article);
  const title = article.title ?? article.slug;
  const articleType = article.articleType?.name ?? undefined;

  const metaItems: Array<[label: string, value?: string | null]> = [
    ["Autor del texto", article.authorText],
    ["Fotos", article.authorPhotos],
    ["Acción", article.authorAction],
  ];
  const hasAnyMeta = metaItems.some(([, v]) => v && String(v).trim());

  const P = {
    overlayPadding: "p-4 sm:p-6",
    titleClass:
      "font-heading font-bold text-white text-2xl sm:text-3xl md:text-4xl leading-tight uppercase drop-shadow",
    metaLineClass:
      "mt-2 text-white/90 text-[13px] sm:text-sm flex flex-wrap items-center gap-2",
    sepClass: "opacity-70 select-none",
    height: "clamp(260px, 45vw, 700px)",
    maxHeight: "90vh",
    gradient:
      "linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.75) 100%)",
  } as const;

  const pieces: React.ReactNode[] = [];
  if (iso) {
    pieces.push(
      <SeoDate
        key="date"
        iso={iso}
        itemProp="datePublished"
        className="text-white/85"
      />
    );
  }

  metaItems
    .filter(([, v]) => v && String(v).trim().length > 0)
    .forEach(([label, value], idx) => {
      pieces.push(
        <span key={`meta-${idx}`} className="text-white/90">
          <span className="font-semibold">{label}:</span> {value}
        </span>
      );
    });

  if (article.youtubeLink) {
    pieces.push(<YouTubeLinkGA key="yt" href={article.youtubeLink} />);
  }

  if (articleType) {
    pieces.push(<ArticleTypeBadge key="type" name={articleType} />);
  }

  const metaLine = pieces.flatMap((node, i) =>
    i === 0
      ? [node]
      : [
          <span key={`sep-${i}`} className={P.sepClass}>
            |
          </span>,
          node,
        ]
  );

  return (
    <header className="mx-auto max-w-page max-w-screen-xl">
      <div
        className="relative block"
        aria-label={title}
        style={{
          height: P.height,
          maxHeight: P.maxHeight,
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-90"
          style={{ background: P.gradient }}
        />

        <div className={`absolute inset-x-0 bottom-0 ${P.overlayPadding}`}>
          <h1 className={`m-0 ${P.titleClass}`}>{title}</h1>

          {(pieces.length > 0 || hasAnyMeta) && (
            <p className={P.metaLineClass}>{metaLine}</p>
          )}
        </div>
      </div>

      <span className="sr-only">{alt ?? title}</span>
    </header>
  );
}
