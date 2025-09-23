import "server-only";
import Link from "next/link";
import { getMirrorState } from "@/server/dataMirror";
import type { Article, ArticleContentBlock } from "@moto125/api-client";
import { Container } from "@/components/common/Container";
import { mediaUrl } from "@/utils/utils";
import { PAGE_SIZE } from "@/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Buscar",
  robots: { index: false, follow: false },
};

type Props = { searchParams: { q?: string; p?: string } };

function getPublicationISO(a: Article): string {
  return a.publicationDate || a.publishedAt || a.createdAt;
}

function getPublicationTime(a: Article): number {
  const iso = getPublicationISO(a);
  const t = iso ? new Date(iso).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function isTextBlock(
  b: ArticleContentBlock
): b is Extract<
  ArticleContentBlock,
  { __component: "article-content.text-content" }
> {
  return (
    b?.__component === "article-content.text-content" &&
    typeof (b as any)?.Text === "string"
  );
}

function normalize(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function stripMd(md: string): string {
  return (md || "")
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/(^|\n)[#>\-\*\+]\s*/g, "\n")
    .replace(/[*_~]+/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function makeSnippet(text: string, query: string, radius = 100): string {
  const plain = stripMd(text);
  if (!plain) return "";
  const nText = normalize(plain);
  const nQuery = normalize(query);
  const idx = nText.indexOf(nQuery);

  if (idx < 0) {
    const safe = escapeHtml(plain.slice(0, 160));
    return safe + (plain.length > 160 ? "…" : "");
  }

  const start = Math.max(0, idx - radius);
  const end = Math.min(plain.length, idx + nQuery.length + radius);
  const before = plain.slice(start, idx);
  const match = plain.slice(idx, idx + nQuery.length);
  const after = plain.slice(idx + nQuery.length, end);

  return `${start > 0 ? "…" : ""}${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}${end < plain.length ? "…" : ""}`;
}

function searchArticles(articles: Article[], q: string) {
  const nq = normalize(q);
  const results: Array<{ article: Article; score: number; snippet?: string }> =
    [];

  for (const a of articles) {
    const title = a.title || a.slug || "";
    const titleHit = normalize(title).includes(nq);

    const md = (a.content ?? [])
      .filter(isTextBlock)
      .map((b) => (b as any).Text as string)
      .filter(Boolean)
      .join("\n\n");

    const contentHit = normalize(stripMd(md)).includes(nq);

    if (titleHit || contentHit) {
      const snippet = md
        ? makeSnippet(md, q, 90)
        : titleHit
          ? `<mark>${escapeHtml(title)}</mark>`
          : "";
      const score = (titleHit ? 2 : 0) + (contentHit ? 1 : 0);
      results.push({ article: a, score, snippet });
    }
  }

  results.sort((x, y) => {
    return getPublicationTime(y.article) - getPublicationTime(x.article);
  });
  return results;
}

// ---- helpers de paginación ----
function pageLink(base: string, q: string, p: number) {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (p > 1) sp.set("p", String(p));
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

function Pages({
  q,
  page,
  totalPages,
}: {
  q: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const make = (p: number) => pageLink("/buscar", q, p);
  const items: number[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) items.push(i);
  } else {
    const add = (n: number) => {
      if (!items.includes(n)) items.push(n);
    };
    add(1);
    add(2);
    add(page - 1);
    add(page);
    add(page + 1);
    add(totalPages - 1);
    add(totalPages);
    // limpia fuera de rango y ordena
    const set = new Set(items.filter((n) => n >= 1 && n <= totalPages));
    items.length = 0;
    Array.from(set)
      .sort((a, b) => a - b)
      .forEach((n) => items.push(n));
  }

  return (
    <nav className="mt-6" aria-label="Paginación">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link
              href={make(page - 1)}
              rel="prev"
              className="px-3 py-1.5 border border-[#e6e6e6] rounded hover:bg-black/5 transition"
            >
              ← Anterior
            </Link>
          ) : (
            <span className="px-3 py-1.5 border border-[#e6e6e6] rounded opacity-50 cursor-not-allowed">
              ← Anterior
            </span>
          )}
        </li>

        {/* números con elipsis */}
        {items.map((n, i) => {
          const prev = items[i - 1];
          const needGap = prev && n - prev > 1;
          return (
            <li key={n}>
              {needGap ? <span className="px-1">…</span> : null}
              {n === page ? (
                <span
                  aria-current="page"
                  className="px-3 py-1.5 border border-[#e6e6e6] rounded bg-black/5 font-medium"
                >
                  {n}
                </span>
              ) : (
                <Link
                  href={make(n)}
                  className="px-3 py-1.5 border border-[#e6e6e6] rounded hover:bg-black/5 transition"
                >
                  {n}
                </Link>
              )}
            </li>
          );
        })}

        <li>
          {page < totalPages ? (
            <Link
              href={make(page + 1)}
              rel="next"
              className="px-3 py-1.5 border border-[#e6e6e6] rounded hover:bg-black/5 transition"
            >
              Siguiente →
            </Link>
          ) : (
            <span className="px-3 py-1.5 border border-[#e6e6e6] rounded opacity-50 cursor-not-allowed">
              Siguiente →
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

// ---- Page ----
export default async function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q || "").trim();
  // página solicitada (>=1)
  let page = Math.max(1, Number(searchParams.p) || 1);

  const state = await getMirrorState();
  const articles = state?.data?.articles ?? [];
  const allResults = q ? searchArticles(articles, q) : [];

  const total = allResults.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) page = totalPages;

  const start = (page - 1) * PAGE_SIZE;
  const slice = allResults.slice(start, start + PAGE_SIZE);

  return (
    <Container>
      <h1 className="mb-4 text-2xl font-heading font-bold uppercase">Buscar</h1>

      <form
        action="/buscar"
        method="get"
        role="search"
        className="mb-6 flex gap-2"
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar artículos…"
          className="w-full rounded-md border border-[#e6e6e6] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          aria-label="Buscar"
        />
        <button
          type="submit"
          className="rounded-md border border-[#e6e6e6] px-4 py-2 hover:bg-black/5 transition"
        >
          Buscar
        </button>
      </form>

      {!q ? (
        <></>
      ) : total === 0 ? (
        <p className="opacity-70">No hay resultados para “{q}”.</p>
      ) : (
        <>
          <p className="mb-3 text-sm opacity-70">
            Mostrando <strong>{start + 1}</strong>–
            <strong>{start + slice.length}</strong> de <strong>{total}</strong>{" "}
            resultados
          </p>

          <ul className="space-y-4">
            {slice.map(({ article, snippet }) => {
              const href = `/${article.slug}`;
              const cover = article.coverImage?.url
                ? mediaUrl(article.coverImage.url)
                : null;
              const title = article.title || article.slug;

              return (
                <li
                  key={article.documentId}
                  className="rounded-lg border border-[#e6e6e6] p-4 hover:shadow-sm transition"
                >
                  <Link href={href} className="group flex gap-4">
                    {cover ? (
                      <img
                        src={cover}
                        alt={title}
                        className="h-20 w-32 object-cover rounded"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-20 w-32 rounded bg-neutral-100" />
                    )}
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold group-hover:text-[var(--color-primary)] transition">
                        {title}
                      </h2>
                      {snippet ? (
                        <p
                          className="mt-1 text-sm opacity-80 line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: snippet }}
                        />
                      ) : null}
                      <p className="mt-1 text-xs opacity-60">
                        {new Date(
                          article.publicationDate ||
                            article.publishedAt ||
                            article.createdAt
                        ).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <Pages q={q} page={page} totalPages={totalPages} />
        </>
      )}
    </Container>
  );
}
