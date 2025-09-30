import "server-only";
import type { MetadataRoute } from "next";
import { getMirrorState } from "@/server/dataMirror";
import {
  buildArticles,
  buildArticleTypes,
  buildCompanies,
  buildLatest,
  buildMotoClasses,
  buildMotos,
  buildMotoTypes,
  buildStatic,
} from "@/utils/sitemapUtils";

/**
 * Convierte items de MetadataRoute.Sitemap a XML
 */
function toXML(items: MetadataRoute.Sitemap) {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const rows = items
    .map((it) => {
      const lastmod =
        it.lastModified instanceof Date
          ? it.lastModified.toISOString()
          : typeof it.lastModified === "string"
          ? new Date(it.lastModified).toISOString()
          : undefined;

      return [
        "<url>",
        `  <loc>${escape(it.url)}</loc>`,
        lastmod ? `  <lastmod>${lastmod}</lastmod>` : "",
        it.changeFrequency ? `  <changefreq>${it.changeFrequency}</changefreq>` : "",
        typeof it.priority === "number" ? `  <priority>${it.priority.toFixed(1)}</priority>` : "",
        "</url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    rows +
    `\n</urlset>\n`;
}

export const dynamic = "force-dynamic";
export const revalidate = 60 * 60 * 24;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const idRaw = params.id || "";
  // Soporta .xml en la URL: /sitemap/static.xml -> "static"
  const id = idRaw.replace(/\.xml$/i, "");

  const state = await getMirrorState();
  const base =
    state?.data?.config?.canonicalUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.moto125.cc";
  const now = new Date();

  const articles = state?.data?.articles ?? [];
  const companies = (state?.data?.companies ?? []).filter((c) => c && c.active !== false);
  const classes = state?.data?.taxonomies?.motoClasses ?? [];
  const types = state?.data?.taxonomies?.motoTypes ?? [];
  const articleTypes = state?.data?.taxonomies?.articleTypes ?? [];
  const motos = state?.data?.motos ?? [];

  let items: MetadataRoute.Sitemap = [];

  if (id === "static")         items = buildStatic(base, now, articles.length);
  else if (id === "articles")  items = buildArticles(base, now, articles);
  else if (id === "article-types")
                              items = buildArticleTypes(base, now, articleTypes, articles);
  else if (id === "companies") items = buildCompanies(base, now, companies);
  else if (id === "moto-classes")
                              items = buildMotoClasses(base, now, classes);
  else if (id === "moto-types")
                              items = buildMotoTypes(base, now, types);
  else if (id === "motos")     items = buildMotos(base, now, motos);
  else if (id === "latest")    items = buildLatest(base, now, articles);
  else if (id === "all") {
    // alias del general por si lo quieres: /sitemap/all.xml
    items = [
      ...buildStatic(base, now, articles.length),
      ...buildArticles(base, now, articles),
      ...buildArticleTypes(base, now, articleTypes, articles),
      ...buildCompanies(base, now, companies),
      ...buildMotoClasses(base, now, classes),
      ...buildMotoTypes(base, now, types),
      ...buildMotos(base, now, motos),
      ...buildLatest(base, now, articles),
    ];
  } else {
    return new Response("Not Found", { status: 404 });
  }

  const xml = toXML(items);
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
