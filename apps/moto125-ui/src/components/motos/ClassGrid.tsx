import "server-only";
import type { MotoClass } from "@moto125/api-client";
import ClassCard from "./ClassCard";

export default function ClassGrid({ classes }: { classes: MotoClass[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {classes.map((clazz) => (
        <ClassCard key={clazz.documentId} clazz={clazz} />
      ))}
    </div>
  );
}
