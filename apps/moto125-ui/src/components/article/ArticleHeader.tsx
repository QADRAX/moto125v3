import type { Article } from "@moto125/api-client";
import { getImage } from "@/utils/utils";
import SeoDate from "../common/SeoDate";
import ArticleTypeBadge from "../common/ArticleTypeBadge";
import { YouTubeIcon } from "../common/YoutubeIcon";

export interface ArticleHeaderProps {
  article: Article;
}

function getBestDateISO(a: Article): string | undefined {
  return a.publicationDate || a.publishedAt || a.updatedAt || a.createdAt;
}

/** Normalize any provided link/ID into a YouTube watch URL */
function toYouTubeWatchUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  try {
    // Plain ID (no slash, no query)
    if (!src.includes("/") && !src.includes("?")) {
      return `https://www.youtube.com/watch?v=${encodeURIComponent(src.trim())}`;
    }
    const url = new URL(src);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      const q = url.search ? url.search : "";
      return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}${q}`;
    }
    // Already a youtube.com URL
    if (url.hostname.includes("youtube.com")) {
      return url.toString();
    }
  } catch {
    // Fallback: treat as ID
    return `https://www.youtube.com/watch?v=${encodeURIComponent(src.trim())}`;
  }
  return undefined;
}

export default function ArticleHeader({ article }: ArticleHeaderProps) {
  const iso = getBestDateISO(article);
  const { url: bgUrl, alt } = getImage(article);
  const title = article.title ?? article.slug;
  const articleType = article.articleType?.name ?? undefined;
  const youtubeWatchUrl = toYouTubeWatchUrl(article.youtubeLink); // ⬅️ normalize link

  // Metadatos “autoría”
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

  // Construimos la línea de metadatos: Fecha | ... | Tipo | [YouTube icon]
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

  if (articleType) {
    pieces.push(<ArticleTypeBadge key="type" name={articleType} />);
  }

  // ⬇️ Añadimos el icono de YouTube si hay vídeo
  if (youtubeWatchUrl) {
    pieces.push(
      <a
        key="yt"
        href={youtubeWatchUrl}
        target="_blank"
        rel="noopener noreferrer external"
        className="inline-flex items-center gap-1 text-white/90 hover:opacity-90"
        title="Ver en YouTube"
        aria-label="Ver vídeo en YouTube (se abre en una pestaña nueva)"
      >
        <YouTubeIcon className="w-5 h-5" />
        <span className="sr-only">YouTube</span>
      </a>
    );
  }

  // Intercalar separadores “|”
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
        {/* Degradado overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-90"
          style={{ background: P.gradient }}
        />

        {/* Contenido */}
        <div className={`absolute inset-x-0 bottom-0 ${P.overlayPadding}`}>
          <h1 className={`m-0 ${P.titleClass}`}>{title}</h1>

          {(pieces.length > 0 || hasAnyMeta) && (
            <p className={P.metaLineClass}>{metaLine}</p>
          )}
        </div>
      </div>

      {/* Texto alternativo accesible */}
      <span className="sr-only">{alt ?? title}</span>
    </header>
  );
}
