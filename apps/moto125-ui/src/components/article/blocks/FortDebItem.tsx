import SectionHeader from "@/components/common/SectionHeader";

export interface FortDebItem {
  id: number;
  value: string;
}

export interface FortDebBlockProps {
  fortalezas?: FortDebItem[] | null;
  debilidades?: FortDebItem[] | null;
  title?: string;
}

export default function FortDebBlock({
  fortalezas,
  debilidades,
  title = "Pros y Contras",
}: FortDebBlockProps) {
  const pros = (fortalezas ?? []).filter((f) => f && f.value?.trim());
  const cons = (debilidades ?? []).filter((d) => d && d.value?.trim());

  const maxRows = Math.max(pros.length, cons.length);
  if (maxRows === 0) return null;

  return (
    <section className="mt-6">
      <SectionHeader title={title} />

      <div className="overflow-x-auto max-w-3xl mx-auto">
        <table className="w-full border-collapse shadow-sm">
          <thead>
            <tr className="bg-[var(--color-surface)]">
              <th className="w-1/2 py-3 px-4 text-left font-semibold border-b border-[var(--color-border)]">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold"
                  >
                    ✓
                  </span>
                  Pros
                </span>
              </th>
              <th className="w-1/2 py-3 px-4 text-left font-semibold border-b border-[var(--color-border)]">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-bold"
                  >
                    ✕
                  </span>
                  Contras
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRows }).map((_, i) => (
              <tr
                key={i}
                className={
                  i % 2 === 0
                    ? "bg-[var(--color-surface)]"
                    : "bg-[var(--color-surface-2,#fafafa)]"
                }
              >
                <td className="py-3 px-4 border-b border-[var(--color-border)] align-top">
                  {pros[i]?.value ?? ""}
                </td>
                <td className="py-3 px-4 border-b border-[var(--color-border)] align-top">
                  {cons[i]?.value ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
