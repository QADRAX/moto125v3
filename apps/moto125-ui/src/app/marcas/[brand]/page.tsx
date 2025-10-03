import "server-only";

import { notFound, redirect } from "next/navigation";
import type { MirrorRootState } from "@moto125/content-cache-core";
import type { Company, Moto } from "@moto125/api-client";
import { getMirrorState } from "@/server/dataMirror";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { slugify } from "@/utils/utils";
import BrandHeader from "@/components/brands/BrandHeader";
import BrandMotoList from "@/components/brands/BrandMotoList";
import { Container } from "@/components/common/Container";
import { BrandJsonLdFromCompany } from "@/components/seo/BrandJsonLd";

export const revalidate = 60;

function findCompanyBySlug(
  state: MirrorRootState,
  brandSlug: string
): Company | null {
  const companies = state?.data?.companies ?? [];
  return companies.find((c) => slugify(c.name) === brandSlug) ?? null;
}

function getMotosByCompany(state: MirrorRootState, company: Company): Moto[] {
  const motos = state?.data?.motos ?? [];
  return motos.filter(
    (m) => m.company && m.company.documentId === company.documentId
  );
}

export async function generateMetadata({
  params,
}: {
  params: { brand: string };
}) {
  const state = await getMirrorState();
  const company = findCompanyBySlug(state, params.brand);
  if (!company) return { title: "Marca no encontrada" };
  return {
    title: company.name,
    description: company.description ?? undefined,
    openGraph: { title: company.name },
    alternates: { canonical: "/marcas/" + params.brand }
  };
}

export default async function BrandDetailPage({
  params,
}: {
  params: { brand: string };
}) {
  const state: MirrorRootState = await getMirrorState();
  const company = findCompanyBySlug(state, params.brand);
  if (!company) notFound();

  const canonical = slugify(company.name);
  if (canonical !== params.brand) {
    redirect(`/marcas/${canonical}`);
  }

  const motos = getMotosByCompany(state, company);

  return (
    <Container>
      <BrandJsonLdFromCompany company={company} />
      <Breadcrumbs
        items={[{ label: "Marcas", href: "/marcas" }, { label: company.name }]}
      />
      <BrandHeader company={company} />
      {motos.length ? (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">
            Modelos de {company.name}
          </h2>
          <BrandMotoList motos={motos} />
        </section>
      ) : (
        <p className="mt-6 opacity-70">
          No hay motos publicadas de esta marca todavía.
        </p>
      )}
    </Container>
  );
}
