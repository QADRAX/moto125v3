import "server-only";
import { notFound, redirect } from "next/navigation";
import type { MirrorRootState } from "@moto125/data-mirror-core";
import type { MotoClass, MotoType } from "@moto125/api-client";
import { getMirrorState } from "@/server/dataMirror";
import { slugify } from "@/utils/utils";
import TypeGrid from "@/components/motos/TypeGrid";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Container } from "@/components/common/Container";

export const revalidate = 60;

function findClassBySlug(
  state: MirrorRootState,
  classSlug: string
): MotoClass | null {
  const classes = state?.data?.taxonomies?.motoClasses ?? [];
  return classes.find((c) => slugify(c.name) === classSlug) ?? null;
}

function getTypesByClass(
  state: MirrorRootState,
  motoClass: MotoClass
): MotoType[] {
  const types = state?.data?.taxonomies?.motoTypes ?? [];
  return types.filter(
    (t) => t.motoClass && t.motoClass.documentId === motoClass.documentId
  );
}

export async function generateMetadata({
  params,
}: {
  params: { class: string };
}) {
  const state = await getMirrorState();
  const mc = findClassBySlug(state, params.class);
  if (!mc) return { title: "Clase no encontrada" };
  return {
    title: `Tipos de ${mc.name}`,
    description: `Explora tipos de ${mc.name}.`,
  };
}

export default async function MotosTypesByClassPage({
  params,
}: {
  params: { class: string };
}) {
  const state: MirrorRootState = await getMirrorState();
  const mc = findClassBySlug(state, params.class);
  if (!mc) notFound();

  const types = getTypesByClass(state, mc);
  if (!types.length) notFound();

  if (types.length === 1) {
    redirect(`/motos/${params.class}/${slugify(types[0].name)}`);
  }

  return (
    <Container>
      <Breadcrumbs
        items={[{ label: "Motos", href: "/motos" }, { label: mc.name }]}
      />
      <h1 className="mb-6 text-3xl font-semibold">Tipos de {mc.name}</h1>
      <TypeGrid classSlug={params.class} types={types} />
    </Container>
  );
}
