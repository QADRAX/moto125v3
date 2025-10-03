import "server-only";
import { notFound } from "next/navigation";
import type { ContentCacheRootState } from "@moto125/content-cache-core";
import type { MotoClass, MotoType, Moto } from "@moto125/api-client";
import { getMirrorState } from "@/server/dataMirror";
import { slugify } from "@/utils/utils";
import MotoList from "@/components/motos/MotoList";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Container } from "@/components/common/Container";

export const revalidate = 60;

function findClassBySlug(
  state: ContentCacheRootState,
  classSlug: string
): MotoClass | null {
  const classes = state?.data?.taxonomies?.motoClasses ?? [];
  return classes.find((c) => slugify(c.name) === classSlug) ?? null;
}

function findTypeBySlug(
  state: ContentCacheRootState,
  typeSlug: string
): MotoType | null {
  const types = state?.data?.taxonomies?.motoTypes ?? [];
  return types.find((t) => slugify(t.name ?? "") === typeSlug) ?? null;
}

function getMotosByType(state: ContentCacheRootState, type: MotoType): Moto[] {
  const motos = state?.data?.motos ?? [];
  return motos.filter(
    (m) => m.motoType && m.motoType.documentId === type.documentId
  );
}

export async function generateMetadata({
  params,
}: {
  params: { class: string; type: string };
}) {
  const state = await getMirrorState();
  const mc = findClassBySlug(state, params.class);
  const mt = findTypeBySlug(state, params.type);
  if (!mc || !mt) return { title: "Tipo no encontrado" };
  return {
    title: `${mt.fullName ?? mt.name} — ${mc.name}`,
    description: `Listado de motos ${mt.name} (${mc.name}).`,
    alternates: { canonical: "/motos/" + params.class + "/" + params.type }
  };
}

export default async function MotosByTypePage({
  params,
}: {
  params: { class: string; type: string };
}) {
  const state: ContentCacheRootState = await getMirrorState();
  const mc = findClassBySlug(state, params.class);
  const mt = findTypeBySlug(state, params.type);
  if (!mc || !mt) notFound();

  const motos = getMotosByType(state, mt);

  return (
    <Container>
      <Breadcrumbs
        items={[
          { label: "Motos", href: "/motos" },
          { label: mc.name, href: `/motos/${params.class}` },
          { label: mt.fullName ?? mt.name },
        ]}
      />
      <h1 className="mb-6 text-3xl font-semibold">{mt.fullName ?? mt.name}</h1>
      <MotoList motos={motos} />
    </Container>
  );
}
