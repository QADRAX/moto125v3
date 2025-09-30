export interface FortDebItem {
  id: number;
  value: string;
}

export interface FortDebBlockProps {
  fortalezas?: FortDebItem[] | null;
  debilidades?: FortDebItem[] | null;
}

export default function FortDebBlock({
  fortalezas,
  debilidades,
}: FortDebBlockProps) {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-2 text-lg font-medium">Pros</h3>
        <ul className="list-disc pl-5">
          {(fortalezas ?? []).map((f) => (
            <li key={f.id}>{f.value}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-lg font-medium">Contras</h3>
        <ul className="list-disc pl-5">
          {(debilidades ?? []).map((d) => (
            <li key={d.id}>{d.value}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
