import "server-only";
import type { MetadataRoute } from "next";
import { getMirrorState } from "@/server/dataMirror";
import { slugify } from "@/utils/utils";
import { PAGE_SIZE } from "@/constants";

function absoluteUrl(base: string, path: string) {
  if (!base)
    throw new Error(
      "Base URL is empty. Set Config.canonicalUrl."
    );
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${cleanBase}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const revalidate = 60 * 60 * 24; // 24h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const state = await getMirrorState();

  const cfg = state?.data?.config;
  const base = cfg?.canonicalUrl || "https://www.moto125.cc";

  const items: MetadataRoute.Sitemap = [];

  const now = new Date();

  const staticRoutes: Array<{
    path: string;
    changefreq?: MetadataRoute.Sitemap[0]["changeFrequency"];
    priority?: number;
  }> = [
    { path: "/", changefreq: "hourly", priority: 1 },
    { path: "/articulos", changefreq: "daily", priority: 0.9 },
    { path: "/marcas", changefreq: "weekly", priority: 0.7 },
    { path: "/motos", changefreq: "weekly", priority: 0.7 },
  ];

  for (const r of staticRoutes) {
    items.push({
      url: absoluteUrl(base, r.path),
      lastModified: now,
      changeFrequency: r.changefreq,
      priority: r.priority,
    });
  }

  const articles = state?.data?.articles ?? [];
  for (const a of articles) {
    const slug = a.slug;
    if (!slug) continue;
    const last =
      (a.updatedAt && new Date(a.updatedAt)) ||
      (a.publishedAt && new Date(a.publishedAt)) ||
      now;

    items.push({
      url: absoluteUrl(base, `/${slug}`),
      lastModified: last,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  if (articles.length > PAGE_SIZE) {
    const totalPages = Math.ceil(articles.length / PAGE_SIZE);
    for (let p = 2; p <= totalPages; p++) {
      items.push({
        url: absoluteUrl(base, `/articulos/p/${p}`),
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
  }

  const articleTypes = state?.data?.taxonomies?.articleTypes ?? [];
  for (const t of articleTypes) {
    const typeSlug = slugify(t.name ?? "");
    if (!typeSlug) continue;

    const last =
      (t.updatedAt && new Date(t.updatedAt)) ||
      (t.publishedAt && new Date(t.publishedAt)) ||
      now;

    items.push({
      url: absoluteUrl(base, `/articulos/tipo/${typeSlug}`),
      lastModified: last,
      changeFrequency: "daily",
      priority: 0.8,
    });

    const typedArticles = (articles ?? []).filter(
      (a) =>
        a.articleType?.documentId && a.articleType.documentId === t.documentId
    );
    if (typedArticles.length > PAGE_SIZE) {
      const totalPages = Math.ceil(typedArticles.length / PAGE_SIZE);
      for (let p = 2; p <= totalPages; p++) {
        items.push({
          url: absoluteUrl(base, `/articulos/tipo/${typeSlug}/p/${p}`),
          lastModified: last,
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
    }
  }

  const companies = (state?.data?.companies ?? []).filter(
    (c) => c && c.active !== false
  );
  for (const c of companies) {
    const brand = slugify(c.name);
    const last =
      (c.updatedAt && new Date(c.updatedAt)) ||
      (c.publishedAt && new Date(c.publishedAt)) ||
      now;

    items.push({
      url: absoluteUrl(base, `/marcas/${brand}`),
      lastModified: last,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  const classes = state?.data?.taxonomies?.motoClasses ?? [];
  for (const mc of classes) {
    const classSlug = slugify(mc.name);
    const last =
      (mc.updatedAt && new Date(mc.updatedAt)) ||
      (mc.publishedAt && new Date(mc.publishedAt)) ||
      now;

    items.push({
      url: absoluteUrl(base, `/motos/${classSlug}`),
      lastModified: last,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  const types = state?.data?.taxonomies?.motoTypes ?? [];
  for (const t of types) {
    const classSlug = slugify(t.motoClass?.name ?? "");
    const typeSlug = slugify(t.name ?? "");
    if (!classSlug || !typeSlug) continue;
    const last =
      (t.updatedAt && new Date(t.updatedAt)) ||
      (t.publishedAt && new Date(t.publishedAt)) ||
      now;

    items.push({
      url: absoluteUrl(base, `/motos/${classSlug}/${typeSlug}`),
      lastModified: last,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  const motos = state?.data?.motos ?? [];
  for (const m of motos) {
    const id = m.moto125Id;
    if (!id) continue;
    const last =
      (m.updatedAt && new Date(m.updatedAt)) ||
      (m.publishedAt && new Date(m.publishedAt)) ||
      now;

    items.push({
      url: absoluteUrl(base, `/moto/${id}`),
      lastModified: last,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return items;
}
