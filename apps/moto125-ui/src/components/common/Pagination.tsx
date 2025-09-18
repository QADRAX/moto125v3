import "server-only";
import Link from "next/link";

type Props = {
  baseHref: string;
  page: number;
  totalPages: number;
};

function pageHref(baseHref: string, page: number) {
  return page <= 1 ? baseHref : `${baseHref}/p/${page}`;
}

export default function Pagination({ baseHref, page, totalPages }: Props) {
  if (totalPages <= 1) return null;

  const windowSize = 5; // show a small window of pages
  const start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav aria-label="Paginación" className="mt-6 flex items-center gap-2">
      {page > 1 && (
        <Link
          rel="prev"
          className="px-3 py-1 border rounded hover-primary"
          href={pageHref(baseHref, page - 1)}
        >
          Anterior
        </Link>
      )}

      {start > 1 && (
        <>
          <Link
            className="px-3 py-1 border rounded hover-primary"
            href={pageHref(baseHref, 1)}
          >
            1
          </Link>
          {start > 2 && <span className="px-2">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(baseHref, p)}
          aria-current={p === page ? "page" : undefined}
          className={`px-3 py-1 border rounded hover-primary ${p === page ? "bg-black text-white" : ""}`}
        >
          {p}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2">…</span>}
          <Link
            className="px-3 py-1 border rounded hover-primary"
            href={pageHref(baseHref, totalPages)}
          >
            {totalPages}
          </Link>
        </>
      )}

      {page < totalPages && (
        <Link
          rel="next"
          className="px-3 py-1 border rounded hover-primary"
          href={pageHref(baseHref, page + 1)}
        >
          Siguiente
        </Link>
      )}
    </nav>
  );
}
