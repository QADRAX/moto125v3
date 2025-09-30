import "server-only";
import { notFound } from "next/navigation";
import type { MirrorRootState } from "@moto125/data-mirror-core";
import type { Company } from "@moto125/api-client";
import { getMirrorState } from "@/server/dataMirror";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import BrandGrid from "@/components/brands/BrandGrid";
import { Container } from "@/components/common/Container";

export const revalidate = 60;

function getCompanies(state: MirrorRootState): Company[] {
  const list = state?.data?.companies ?? [];
  return list
    .filter((c) => c && c.active !== false)
    .slice()
    .sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" })
    );
}

export default async function BrandsIndexPage() {
  const state: MirrorRootState = await getMirrorState();
  const companies = getCompanies(state);
  if (!companies.length) notFound();

  return (
    <Container>
      <Breadcrumbs items={[{ label: "Marcas" }]} />
      <h1 className="mb-6 text-3xl font-semibold">Marcas</h1>
      <BrandGrid companies={companies} />
    </Container>
  );
}

export async function generateMetadata() {
  return {
    title: "Marcas de motos",
    description: "Explora todas las marcas de motos de moto125.",
    alternates: { canonical: "/marcas" }
  };
}
