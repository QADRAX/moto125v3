import "server-only";
import { redirect, notFound } from "next/navigation";
import type { MirrorRootState } from "@moto125/data-mirror-core";
import type { MotoClass } from "@moto125/api-client";
import { getMirrorState } from "@/server/dataMirror";
import { slugify } from "@/utils/utils";
import ClassGrid from "@/components/motos/ClassGrid";
import Breadcrumbs from "@/components/common/Breadcrumbs";

export const revalidate = 60;

function getClasses(state: MirrorRootState): MotoClass[] {
  return state?.data?.taxonomies?.motoClasses ?? [];
}

export default async function MotosClassesPage() {
  const state: MirrorRootState = await getMirrorState();
  const classes = getClasses(state).filter(Boolean);
  if (!classes.length) notFound();

  if (classes.length === 1) {
    const only = classes[0];
    redirect(`/motos/${slugify(only.name)}`);
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Motos" }]} />
      <h1 className="mb-6 text-3xl font-semibold">
        Selecciona la clase de moto
      </h1>
      <ClassGrid classes={classes} />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Motos por clase",
    description: "Explora scooters y motos por clase.",
  };
}
