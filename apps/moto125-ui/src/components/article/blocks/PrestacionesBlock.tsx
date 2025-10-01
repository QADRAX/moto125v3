import SectionHeader from "@/components/common/SectionHeader";
import { ArticlePrestaciones } from "@moto125/api-client";

export interface PrestacionesBlockProps {
  prestaciones: ArticlePrestaciones;
}

const LABELS: Record<keyof ArticlePrestaciones, string> = {
  acc50m: "Aceleración 50 m",
  acc100m: "Aceleración 100 m",
  acc400m: "Aceleración 400 m",
  acc1000m: "Aceleración 1000 m",
  acc100kmh: "Aceleración 0-100 km/h",
  maxSpeed: "Velocidad máxima",
  consumo: "Consumo",
  autonomia: "Autonomía",
  pesoTotal: "Peso total",
  repartoTrasero: "Reparto trasero",
  repartoFrontral: "Reparto frontal",
};

export default function PrestacionesBlock({ prestaciones }: PrestacionesBlockProps) {
  const rows = Object.entries(prestaciones).filter(([, v]) => v != null && v !== "");
  if (!rows.length) return null;

  return (
    <section className="mt-6">

      <SectionHeader title="Prestaciones" />

      <p className="my-2 text-sm italic text-[var(--color-muted,#666)]">
        Los datos de esta prueba han sido medidos en <strong>moto125.cc</strong> con nuestro propio equipo de telemetría y no proceden de terceros.
      </p>

      {/* Mobile: cards grid */}
      <div className="md:hidden py-4">
        <ul
          role="list"
          className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]"
        >
          {rows.map(([k, v]) => {
            const label = LABELS[k as keyof ArticlePrestaciones] ?? k;
            return (
              <li
                key={k}
                className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center shadow-sm"
              >
                <div className="text-[10px] uppercase tracking-wide text-[var(--color-muted,#777)]">
                  {label}
                </div>
                <div className="mt-1 text-base font-semibold">{String(v)}</div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop: classic table */}
      <div className="hidden md:block overflow-x-auto py-4">
        <table className="w-full text-center border-separate border-spacing-0 overflow-hidden shadow-sm">
          <tbody>
            {rows.map(([k, v], i) => {
              const label = LABELS[k as keyof ArticlePrestaciones] ?? k;
              return (
                <tr
                  key={k}
                  className={i % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-2,#fafafa)]"}
                >
                  <th
                    scope="row"
                    className="w-1/2 py-3 px-4 font-medium border-b border-[var(--color-border)]"
                  >
                    {label}
                  </th>
                  <td className="py-3 px-4 font-semibold border-b border-[var(--color-border)]">
                    {String(v)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
