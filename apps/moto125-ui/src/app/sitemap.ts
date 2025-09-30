import "server-only";
import type { MetadataRoute } from "next";
import { getMirrorState } from "@/server/dataMirror";
import {
  buildArticles,
  buildArticleTypes,
  buildCompanies,
  buildMotoClasses,
  buildMotos,
  buildMotoTypes,
  buildStatic,
} from "@/utils/sitemapUtils";

export const dynamic = "force-dynamic";
export const revalidate = 60 * 60 * 24;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const state = await getMirrorState();
  const base =
    state?.data?.config?.canonicalUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.moto125.cc";
  const now = new Date();

  const articles = state?.data?.articles ?? [];
  const companies = (state?.data?.companies ?? []).filter(
    (c) => c && c.active !== false
  );
  const classes = state?.data?.taxonomies?.motoClasses ?? [];
  const types = state?.data?.taxonomies?.motoTypes ?? [];
  const articleTypes = state?.data?.taxonomies?.articleTypes ?? [];
  const motos = state?.data?.motos ?? [];

  return [
    ...buildStatic(base, now, articles.length),
    ...buildArticles(base, now, articles),
    ...buildArticleTypes(base, now, articleTypes, articles),
    ...buildCompanies(base, now, companies),
    ...buildMotoClasses(base, now, classes),
    ...buildMotoTypes(base, now, types),
    ...buildMotos(base, now, motos),
  ];
}
