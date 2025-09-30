import { PAGE_SIZE } from "@/constants";
import type { MetadataRoute } from "next";
import { slugify } from "./utils";

function absoluteUrl(base: string, path: string) {
  if (!base) throw new Error("Base URL is empty. Set Config.canonicalUrl.");
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${cleanBase}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function buildStatic(base: string, now: Date, articlesLen: number): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];
  const staticRoutes: Array<{
    path: string;
    changefreq?: MetadataRoute.Sitemap[0]["changeFrequency"];
    priority?: number;
  }> = [
    { path: "/", changefreq: "hourly", priority: 1 },
    { path: "/articulos", changefreq: "daily", priority: 0.8 },
    { path: "/marcas", changefreq: "weekly", priority: 0.3 },
    { path: "/motos", changefreq: "weekly", priority: 0.5 },
  ];
  for (const r of staticRoutes) {
    items.push({
      url: absoluteUrl(base, r.path),
      lastModified: now,
      changeFrequency: r.changefreq,
      priority: r.priority,
    });
  }
  if (articlesLen > PAGE_SIZE) {
    const totalPages = Math.ceil(articlesLen / PAGE_SIZE);
    for (let p = 2; p <= totalPages; p++) {
      items.push({
        url: absoluteUrl(base, `/articulos/p/${p}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }
  return items;
}

export function buildArticles(base: string, now: Date, articles: any[]): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];
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
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }
  return items;
}

export function buildArticleTypes(base: string, now: Date, articleTypes: any[], articles: any[]): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];
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
      changeFrequency: "weekly",
      priority: 0.8,
    });

    const typedArticles = (articles ?? []).filter(
      (a: any) => a.articleType?.documentId && a.articleType.documentId === t.documentId
    );
    if (typedArticles.length > PAGE_SIZE) {
      const totalPages = Math.ceil(typedArticles.length / PAGE_SIZE);
      for (let p = 2; p <= totalPages; p++) {
        items.push({
          url: absoluteUrl(base, `/articulos/tipo/${typeSlug}/p/${p}`),
          lastModified: last,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  }
  return items;
}

export function buildCompanies(base: string, now: Date, companies: any[]): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];
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
  return items;
}

export function buildMotoClasses(base: string, now: Date, classes: any[]): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];
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
  return items;
}

export function buildMotoTypes(base: string, now: Date, types: any[]): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];
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
  return items;
}

export function buildMotos(base: string, now: Date, motos: any[]): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];
  for (const m of motos) {
    const motoId = m.moto125Id;
    if (!motoId) continue;
    const last =
      (m.updatedAt && new Date(m.updatedAt)) ||
      (m.publishedAt && new Date(m.publishedAt)) ||
      now;
    items.push({
      url: absoluteUrl(base, `/moto/${motoId}`),
      lastModified: last,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }
  return items;
}

export function buildLatest(base: string, now: Date, articles: any[]): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];
  const pickDate = (a: any) =>
    new Date(a.publicationDate || a.publishedAt || a.updatedAt || a.createdAt || now);
  const latest5 = [...articles].sort((a, b) => +pickDate(b) - +pickDate(a)).slice(0, 5);
  for (const a of latest5) {
    const slug = a.slug;
    if (!slug) continue;
    const last = pickDate(a);
    items.push({
      url: absoluteUrl(base, `/${slug}`),
      lastModified: last,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }
  return items;
}