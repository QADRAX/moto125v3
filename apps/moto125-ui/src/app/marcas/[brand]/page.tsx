import "server-only";

import { notFound, redirect } from "next/navigation";
import type { ContentCacheRootState } from "@moto125/content-cache-core";
import type { Company, Moto } from "@moto125/api-client";
import { getMirrorState } from "@/server/dataMirror";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { slugify } from "@/utils/utils";
import BrandHeader from "@/components/brands/BrandHeader";
import BrandMotoList from "@/components/brands/BrandMotoList";
import { Container } from "@/components/common/Container";
import { BrandJsonLdFromCompany } from "@/components/seo/BrandJsonLd";
import RelatedArticles from "@/components/articles/RelatedArticles";

export const revalidate = 60;

function findCompanyBySlug(
  state: ContentCacheRootState,
  brandSlug: string
): Company | null {
  const companies = state?.data?.companies ?? [];
  return companies.find((c) => slugify(c.name) === brandSlug) ?? null;
}

function getMotosByCompany(
  state: ContentCacheRootState,
  company: Company
): Moto[] {
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
    alternates: { canonical: "/marcas/" + params.brand },
  };
}

export default async function BrandDetailPage({
  params,
}: {
  params: { brand: string };
}) {
  const state: ContentCacheRootState = await getMirrorState();
  const company = findCompanyBySlug(state, params.brand);
  if (!company) notFound();

  const canonical = slugify(company.name);
  if (canonical !== params.brand) {
    redirect(`/marcas/${canonical}`);
  }

  const motos = getMotosByCompany(state, company);
  const motoTypes = state?.data?.taxonomies?.motoTypes ?? [];

  return (
    <Container>
      <BrandJsonLdFromCompany company={company} />
      <Breadcrumbs
        items={[{ label: "Marcas", href: "/marcas" }, { label: company.name }]}
      />
      <BrandHeader company={company} />
      {company.articles && <RelatedArticles articles={company.articles} />}
      <BrandMotoList
        motos={motos}
        motoTypes={motoTypes}
        title={`Modelos 125 de ${company.name}`}
        className="mt-8"
      />
    </Container>
  );
}
