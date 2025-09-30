import "server-only";
import { getMirrorState } from "@/server/dataMirror";
import { getThumbnailUrl, mediaUrl } from "@/utils/utils";

export const dynamic = "force-dynamic";
export const revalidate = 60 * 30; // 30 min

function abs(base: string, path: string) {
  const clean = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${clean}${path.startsWith("/") ? "" : "/"}${path}`;
}

function pickDate(a: any, now = new Date()) {
  return new Date(a?.publicationDate || a?.publishedAt || a?.updatedAt || a?.createdAt || now);
}

export async function GET() {
  const state = await getMirrorState();

  const cfg   = state?.data?.config ?? null;
  const base  = cfg?.canonicalUrl || "https://www.moto125.cc";
  const title = cfg?.siteName || "moto125.cc";
  const desc  = cfg?.metaDescriptionDefault || cfg?.openGraphDescription || "Comparativas, pruebas y datos de motos 125.";

  const articles = (state?.data?.articles ?? [])
    .filter((a: any) => a?.slug && a?.visible !== false)
    .sort((a: any, b: any) => +pickDate(b) - +pickDate(a))
    .slice(0, 50);

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title,
    home_page_url: base,
    feed_url: abs(base, "/feed.json"),
    description: desc,
    language: "es",
    items: articles.map((a) => {
      const url   = abs(base, `/${a.slug}`);
      const cover = getThumbnailUrl(a?.coverImage) || undefined;
      const date  = pickDate(a).toISOString();

      return {
        id: url,
        url,
        title: a?.title ?? a.slug,
        date_published: date,
        image: cover,
        tags: (a?.tags ?? []).map((t: any) => t?.Value).filter(Boolean),
        content_text: a?.articleType?.name
          ? `${a.articleType.name} — ${a.title ?? a.slug}`
          : (a?.title ?? a.slug),
      };
    }),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
