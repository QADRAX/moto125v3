import { computeArticleDescription } from "@/utils/extractArticleDescription";
import JsonLd from "./JsonLd";
import { getMirrorState } from "@/server/dataMirror";
import { mediaUrl } from "@/utils/utils";
import { Article } from "@moto125/api-client";

type Props = {
  url: string;
  title: string;
  description?: string | null;
  image?: string | null; // absoluta
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  publisherName?: string | null;
  publisherLogo?: string | null; // absoluta
  section?: string | null; // tipo/categoría
  keywords?: string[];     // tags
};

export default function ArticleJsonLd({
  url, title, description, image,
  datePublished, dateModified,
  authorName, publisherName, publisherLogo,
  section, keywords
}: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: url,
    headline: title,
    description: description ?? undefined,
    image: image ? [image] : undefined,
    datePublished: datePublished ?? undefined,
    dateModified: dateModified ?? datePublished ?? undefined,
    author: authorName ? { "@type": "Person", name: authorName } : undefined,
    publisher: publisherName ? {
      "@type": "Organization",
      name: publisherName,
      logo: publisherLogo ? { "@type": "ImageObject", url: publisherLogo } : undefined,
    } : undefined,
    articleSection: section ?? undefined,
    keywords: keywords?.length ? keywords.join(", ") : undefined,
  };

  return <JsonLd data={data} />;
}


export async function ArticleJsonLdFromArticle({ article }: { article: Article }) {
  const state = await getMirrorState();
  const cfg = state?.data?.config;

  const base =
    (cfg?.canonicalUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const url = base ? `${base}/${article.slug}` : `/${article.slug}`;

  const publisherName = cfg?.siteName ?? undefined;
  const publisherLogo = cfg?.logo?.url ? mediaUrl(cfg.logo.url) : undefined;

  const title = article.title || article.slug;
  const description =
    computeArticleDescription(article, { maxLength: 170 }) ??
    article.authorText ??
    undefined;

  const image = article.coverImage?.url ? mediaUrl(article.coverImage.url) : undefined;

  const datePublished =
    article.publicationDate || article.publishedAt || article.createdAt || undefined;

  const dateModified = article.updatedAt || datePublished || undefined;

  const authorName = article.authorAction || undefined;
  const section = article.articleType?.name || undefined;
  const keywords =
    (article.tags ?? [])
      .map((t) => t.Value)
      .filter((v): v is string => Boolean(v)) || undefined;

  return (
    <ArticleJsonLd
      url={url}
      title={title}
      description={description}
      image={image}
      datePublished={datePublished}
      dateModified={dateModified}
      authorName={authorName}
      publisherName={publisherName}
      publisherLogo={publisherLogo}
      section={section ?? null}
      keywords={keywords}
    />
  );
}