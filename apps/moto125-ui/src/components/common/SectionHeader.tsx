import "server-only";
import type { ReactNode } from "react";

export default function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <section className="border border-[var(--color-border)] bg-[var(--color-surface)] mb-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-heading font-bold uppercase tracking-[var(--tracking-wide-1)] text-lg">
          <span className="inline-block bg-[var(--color-primary)] text-white px-3 py-2">
            {title}
          </span>
        </h2>

        {action && (
          <div className="shrink-0 text-xs sm:text-sm font-heading uppercase mr-3">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}
