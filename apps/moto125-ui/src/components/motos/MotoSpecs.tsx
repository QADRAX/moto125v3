import type { MotoFichaTecnica } from "@moto125/api-client";

export interface MotoSpecsProps {
  ficha: MotoFichaTecnica | Record<string, unknown>;
}

export default function MotoSpecs({ ficha }: MotoSpecsProps) {
  const entries = Object.entries(ficha || {}).filter(
    ([, v]) => v != null && v !== ""
  );
  if (!entries.length) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold">Ficha técnica</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {entries.map(([k, v]) => (
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
    </section>
  );
}
