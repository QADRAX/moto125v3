import { getMirrorState } from "@/server/dataMirror";
import JsonLd from "./JsonLd";
import { mediaUrl, slugify } from "@/utils/utils";
import { Company } from "@moto125/api-client";

type Props = {
  name: string;
  url: string;
  logo?: string | null;
  sameAs?: string[];
};

export default function BrandJsonLd({ name, url, logo, sameAs }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name,
    url,
    logo: logo ?? undefined,
    sameAs: sameAs && sameAs.length ? sameAs : undefined,
  };
  return <JsonLd data={data} />;
}

export async function BrandJsonLdFromCompany({ company }: { company: Company }) {
  const state = await getMirrorState();
  const cfg = state?.data?.config;

  // Base para canonical
  const base =
    (cfg?.canonicalUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const path = `/marcas/${slugify(company.name)}`;
  const url = base ? `${base}${path}` : path; // relativo si no hay base

  // Logo: imagen de la marca
  const logo = company.image?.url ? mediaUrl(company.image.url) : undefined;

  // sameAs: si la marca tiene web oficial, la añadimos
  const sameAs = company.url ? [company.url] : undefined;

  return <BrandJsonLd name={company.name} url={url} logo={logo} sameAs={sameAs} />;
}