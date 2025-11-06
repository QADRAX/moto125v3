import "server-only";
import { notFound } from "next/navigation";
import type { ContentCacheRootState } from "@moto125/content-cache-core";
import type { Moto } from "@moto125/api-client";
import { getMirrorState } from "@/server/dataMirror";
import { getThumbnailUrl, slugify } from "@/utils/utils";
import MotoHeader from "@/components/motos/MotoHeader";
import MotoSpecs from "@/components/motos/MotoSpecs";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Container } from "@/components/common/Container";
import { MotoProductJsonLdFromMoto } from "@/components/seo/MotoProductJsonLd";
import MotoImageGallery from "@/components/motos/MotoImageGallery";
import RelatedArticles from "@/components/articles/RelatedArticles";

export const revalidate = 60;

function findMotoByParam(
  state: ContentCacheRootState,
  param: string
): Moto | null {
  const motos = state?.data?.motos ?? [];
  return motos.find((m) => m.moto125Id === param) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { moto: string };
}) {
  const state = await getMirrorState();
  const moto = findMotoByParam(state, params.moto);
  if (!moto) return { title: "Moto no encontrada" };

  const cover = moto.images?.[0]?.url
    ? getThumbnailUrl(moto.images[0])
    : undefined;

  return {
    title: moto.fullName ?? moto.modelName,
    description: moto.description ?? undefined,
    openGraph: {
      type: "article",
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      images: cover ? [cover] : undefined,
    },
    alternates: { canonical: "/moto/" + params.moto },
  };
}

export default async function MotoDetailPage({
  params,
}: {
  params: { moto: string };
}) {
  const state: ContentCacheRootState = await getMirrorState();
  const moto = findMotoByParam(state, params.moto);

  if (!moto) notFound();

  const mc = moto.motoType?.motoClass ?? null;
  const mt = moto.motoType ?? null;

  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Motos", href: "/motos" },
  ];

  if (mc?.name) {
    const classSlug = slugify(mc.name);
    crumbs.push({ label: mc.name, href: `/motos/${classSlug}` });
  }

  if (mt?.name || mt?.fullName) {
    const typeLabel = mt?.fullName ?? mt?.name!;
    const typeSlug = slugify(mt?.name ?? mt?.fullName ?? "");
    const baseSegments = ["", "motos"];
    if (mc?.name) baseSegments.push(slugify(mc.name));
    const typeHref = baseSegments.concat(typeSlug).join("/");
    crumbs.push({ label: typeLabel, href: typeHref });
  }

  crumbs.push({ label: moto.fullName ?? moto.modelName });

  return (
    <Container>
      <MotoProductJsonLdFromMoto moto={moto} />
      <Breadcrumbs items={crumbs} />
      <MotoHeader moto={moto} />
      <MotoSpecs ficha={moto.fichaTecnica ?? {}} />
      {moto.articles && <RelatedArticles articles={moto.articles} />}
      <MotoImageGallery moto={moto} />
    </Container>
  );
}
