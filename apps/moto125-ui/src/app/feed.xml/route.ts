import "server-only";
import { getMirrorState } from "@/server/dataMirror";
import { mediaUrl } from "@/utils/utils";

export const dynamic = "force-dynamic";
export const revalidate = 60 * 30; // 30 min

function abs(base: string, path: string) {
  const clean = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${clean}${path.startsWith("/") ? "" : "/"}${path}`;
}
function esc(s?: string | null) {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function pickDate(a: any, now = new Date()) {
  return new Date(
    a?.publicationDate || a?.publishedAt || a?.updatedAt || a?.createdAt || now
  );
}

export async function GET() {
  const state = await getMirrorState();

  const cfg = state?.data?.config ?? null;
  const base =
    cfg?.canonicalUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.moto125.cc";
  const title = cfg?.siteName || "moto125.cc";
  const desc =
    cfg?.metaDescriptionDefault ||
    cfg?.openGraphDescription ||
    "Comparativas, pruebas y datos de motos 125.";

  const articles = (state?.data?.articles ?? [])
    .filter((a: any) => a?.slug && a?.visible !== false)
    .sort((a: any, b: any) => +pickDate(b) - +pickDate(a))
    .slice(0, 50);

  const selfUrl = abs(base, "/feed.xml");
  const lastBuild = new Date().toUTCString();

  const items = articles
    .map((a: any) => {
      const url = abs(base, `/${a.slug}`);
      const guid = url;
      const pub = pickDate(a).toUTCString();

      const simpleDesc = a?.articleType?.name
        ? `${a.articleType.name} — ${a.title ?? a.slug}`
        : (a?.title ?? a.slug);

      const cover = mediaUrl(a?.coverImage?.url) || "";

      const descHtml = cover
        ? `<![CDATA[<p><img src="${esc(cover)}" alt="${esc(a?.title ?? a.slug)}" /></p><p>${esc(simpleDesc)}</p>]]>`
        : `<![CDATA[<p>${esc(simpleDesc)}</p>]]>`;

      return [
        "<item>",
        `  <title>${esc(a?.title ?? a.slug)}</title>`,
        `  <link>${esc(url)}</link>`,
        `  <guid isPermaLink="true">${esc(guid)}</guid>`,
        `  <pubDate>${pub}</pubDate>`,
        `  <description>${descHtml}</description>`,
        // Categorías opcionales desde tags
        ...(Array.isArray(a?.tags)
          ? a.tags
              .filter((t: any) => t?.Value)
              .slice(0, 8)
              .map((t: any) => `  <category>${esc(t.Value)}</category>`)
          : []),
        "</item>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(title)}</title>
    <link>${esc(base)}</link>
    <description>${esc(desc)}</description>
    <atom:link href="${esc(selfUrl)}" rel="self" type="application/rss+xml" />
    <language>es</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
