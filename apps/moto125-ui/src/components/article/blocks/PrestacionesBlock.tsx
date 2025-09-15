import { ArticlePrestaciones } from "@moto125/api-client";

export interface PrestacionesBlockProps {
  prestaciones: ArticlePrestaciones;
}

export default function PrestacionesBlock({
  prestaciones,
}: PrestacionesBlockProps) {
  const rows = Object.entries(prestaciones).filter(
    ([, v]) => v != null && v !== ""
  );

  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b">
              <th className="w-1/3 py-2 pr-4 text-left font-medium capitalize">
                {k}
              </th>
              <td className="py-2">{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
