import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/api/", "/_next/", "/static/", "/buscar"],
    },
    sitemap: "https://www.moto125.cc/sitemap.xml",
  };
}
