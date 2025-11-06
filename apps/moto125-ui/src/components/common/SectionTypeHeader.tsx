import Link from "next/link";

/**
 * Header for each moto type section.
 * Displays:
 * - A circular framed icon.
 * - A title with the count.
 * - A mandatory subtitle link like: "Ver otros modelos del tipo {label}".
 */
export function SectionTypeHeader({
  icon,
  label,
  count,
  href,
}: {
  icon?: string;
  label: string;
  count: number;
  /** Destination link to the moto type page (required). */
  href: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-4">
      {/* Circular framed icon */}
      <div
        className={[
          "relative grid place-items-center",
          "h-14 w-14 shrink-0 rounded-full",
          "bg-[var(--color-surface)] ring-1 ring-[var(--color-border)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
        ].join(" ")}
        aria-hidden="true"
      >
        {icon ? (
          <img
            src={icon}
            alt=""
            className="max-h-9 max-w-9 object-contain"
            aria-hidden="true"
            decoding="async"
            loading="lazy"
          />
        ) : (
          <span className="block h-9 w-9" aria-hidden="true" />
        )}
      </div>

      {/* Title + mandatory subtitle link */}
      <div className="min-w-0">
        <h3 className="m-0 text-xl font-semibold leading-tight tracking-tight">
          {label}
          <span className="ml-2 align-middle text-sm font-normal opacity-60">
            ({count})
          </span>
        </h3>

        <Link
          href={href}
          className="mt-0.5 inline-block text-xs uppercase tracking-[var(--tracking-wide-1)] text-[var(--color-muted,#6b7280)] hover:text-[var(--color-primary)] hover:underline transition-colors"
        >
          Ver otros modelos del tipo {label}
        </Link>
      </div>
    </div>
  );
}
