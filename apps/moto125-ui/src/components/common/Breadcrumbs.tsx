import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}
export interface BreadcrumbsProps {
  items: Crumb[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items?.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-neutral-600">
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${it.label}-${idx}`} className="flex items-center gap-1">
              {it.href && !isLast ? (
                <Link href={it.href} className="hover:underline">
                  {it.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-black" : undefined}>
                  {it.label}
                </span>
              )}
              {!isLast && <span className="px-1">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
