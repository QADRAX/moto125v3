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

export default function PrestacionesBlock({
  prestaciones,
}: PrestacionesBlockProps) {
  const rows = Object.entries(prestaciones).filter(
    ([, v]) => v != null && v !== ""
  );

  if (!rows.length) return null;

  return (
    <section className="overflow-x-auto">
      <table className="w-full border-collapse">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b">
              <th className="w-1/3 py-2 pr-4 text-left font-medium">
                {LABELS[k as keyof ArticlePrestaciones] ?? k}
              </th>
              <td className="py-2">{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
