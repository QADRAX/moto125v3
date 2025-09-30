import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://www.moto125.cc";
  return {
    rules: {
      userAgent: "*",
      disallow: ["/api/", "/_next/", "/static/", "/buscar"],
    },
    sitemap: [
      `${base}/sitemap.xml`,
      `${base}/sitemap/static.xml`,
      `${base}/sitemap/articles.xml`,
      `${base}/sitemap/article-types.xml`,
      `${base}/sitemap/companies.xml`,
      `${base}/sitemap/moto-classes.xml`,
      `${base}/sitemap/moto-types.xml`,
      `${base}/sitemap/motos.xml`,
      `${base}/sitemap/latest.xml`,
    ],
  };
}
