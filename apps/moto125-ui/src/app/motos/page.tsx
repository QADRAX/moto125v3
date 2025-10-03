import "server-only";
import { redirect, notFound } from "next/navigation";
import type { ContentCacheRootState } from "@moto125/content-cache-core";
import type { MotoClass } from "@moto125/api-client";
import { getMirrorState } from "@/server/dataMirror";
import { slugify } from "@/utils/utils";
import ClassGrid from "@/components/motos/ClassGrid";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Container } from "@/components/common/Container";

export const revalidate = 60;

function getClasses(state: ContentCacheRootState): MotoClass[] {
  return state?.data?.taxonomies?.motoClasses ?? [];
}

export default async function MotosClassesPage() {
  const state: ContentCacheRootState = await getMirrorState();
  const classes = getClasses(state).filter(Boolean);
  if (!classes.length) notFound();

  if (classes.length === 1) {
    const only = classes[0];
    redirect(`/motos/${slugify(only.name)}`);
  }

  return (
    <Container>
      <Breadcrumbs items={[{ label: "Motos" }]} />
      <h1 className="mb-6 text-3xl font-semibold">
        Selecciona la clase de moto
      </h1>
      <ClassGrid classes={classes} />
    </Container>
  );
}

export async function generateMetadata() {
  return {
    title: "Motos por clase",
    description: "Explora scooters y motos por clase.",
    alternates: { canonical: "/motos" }
  };
}
