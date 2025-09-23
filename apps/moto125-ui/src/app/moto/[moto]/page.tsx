import "server-only";
import { notFound } from "next/navigation";
import type { MirrorRootState } from "@moto125/data-mirror-core";
import type { Moto, MotoType, MotoClass } from "@moto125/api-client";
import { getMirrorState } from "@/server/dataMirror";
import { slugify } from "@/utils/utils";
import MotoHeader from "@/components/motos/MotoHeader";
import MotoSpecs from "@/components/motos/MotoSpecs";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Container } from "@/components/common/Container";
import { MotoProductJsonLdFromMoto } from "@/components/seo/MotoProductJsonLd";

export const revalidate = 60;

function findClassBySlug(
  state: MirrorRootState,
  classSlug: string
): MotoClass | null {
  const classes = state?.data?.taxonomies?.motoClasses ?? [];
  return classes.find((c) => slugify(c.name) === classSlug) ?? null;
}

function findTypeBySlug(
  state: MirrorRootState,
  typeSlug: string
): MotoType | null {
  const types = state?.data?.taxonomies?.motoTypes ?? [];
  return types.find((t) => slugify(t.name ?? "") === typeSlug) ?? null;
}

function findMotoByParam(state: MirrorRootState, param: string): Moto | null {
  const motos = state?.data?.motos ?? [];
  return motos.find((m) => m.moto125Id === param) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { class: string; type: string; moto: string };
}) {
  const state = await getMirrorState();
  const mc = findClassBySlug(state, params.class);
  const mt = findTypeBySlug(state, params.type);
  const moto = findMotoByParam(state, params.moto);
  if (!mc || !mt || !moto) return { title: "Moto no encontrada" };
  return {
    title: moto.fullName ?? moto.modelName,
    description: moto.description ?? undefined,
  };
}

export default async function MotoDetailPage({
  params,
}: {
  params: { moto: string };
}) {
  const state: MirrorRootState = await getMirrorState();
  const moto = findMotoByParam(state, params.moto);
  
  const mc = moto.motoType?.motoClass;
  const mt = moto.motoType;

  if (!moto) notFound();

  return (
    <Container>
      <MotoProductJsonLdFromMoto moto={moto} />
      <Breadcrumbs
        items={[
          { label: "Motos", href: "/motos" },
          { label: mc.name, href: `/motos/${slugify(mc.name)}` },
          {
            label: mt.fullName ?? mt.name,
            href: `/motos/${slugify(mc.name)}/${slugify(mt.name)}`,
          },
          { label: moto.fullName ?? moto.modelName },
        ]}
      />
      <MotoHeader moto={moto} />
      <MotoSpecs ficha={moto.fichaTecnica ?? {}} />
    </Container>
  );
}
