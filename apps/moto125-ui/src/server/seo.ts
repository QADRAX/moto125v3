import "server-only";
import type { Metadata } from "next";
import type { Config, Article } from "@moto125/api-client";
import { mediaUrl } from "@/utils/utils";

/**
 * Normalizes a Twitter handle to include the '@' prefix.
 */
function normalizeTwitterHandle(h?: string | null): string | undefined {
  if (!h) return undefined;
  return h.startsWith("@") ? h : `@${h}`;
}

/**
 * Picks a safe MetadataBase URL from config (falls back to env or undefined).
 */
function pickMetadataBase(cfg?: Config | null): URL | undefined {
  const base = cfg?.canonicalUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  try {
    return base ? new URL(base) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Builds the Next.js Metadata object using global Config defaults.
 * Use in the root layout to set site-wide defaults.
 */
export function buildSiteMetadataFromConfig(cfg?: Config | null): Metadata {
  const siteName = cfg?.siteName ?? "moto125-ui";

  // Title & description defaults
  const defaultTitle =
    cfg?.metaTitleDefault ?? cfg?.openGraphTitle ?? siteName;

  const defaultDescription =
    cfg?.openGraphDescription ??
    cfg?.metaDescriptionDefault ??
    "Comparativas, pruebas y datos de motos 125.";

  // OG image / Twitter image
  const ogImg =
    mediaUrl(cfg?.openGraphImage?.url) ||
    mediaUrl(cfg?.metaImageDefault?.url) ||
    undefined;

  // Favicon(s)
  const faviconUrl = mediaUrl(cfg?.favicon?.url) || undefined;

  const metadata: Metadata = {
    metadataBase: pickMetadataBase(cfg),
    applicationName: siteName,

    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },

    description: defaultDescription,

    icons: faviconUrl
      ? {
          icon: [{ url: faviconUrl }],
          shortcut: [{ url: faviconUrl }],
          apple: [{ url: faviconUrl }],
        }
      : undefined,

    alternates: cfg?.canonicalUrl
      ? { canonical: cfg.canonicalUrl }
      : undefined,

    openGraph: {
      type: "website",
      siteName,
      title: defaultTitle,
      description: defaultDescription,
      images: ogImg ? [{ url: ogImg }] : undefined,
    },

    twitter: {
      card: "summary_large_image",
      site: normalizeTwitterHandle(cfg?.twitterHandle),
      title: defaultTitle,
      description: defaultDescription,
      images: ogImg ? [ogImg] : undefined,
    },

  };

  return metadata;
}

/**
 * Builds page-specific Metadata for an Article using global Config as fallback.
 * Use this in article route's generateMetadata().
 */
export function buildArticleMetadata(article: Article, cfg?: Config | null): Metadata {
  const siteDefaults = buildSiteMetadataFromConfig(cfg);

  const title = article.title ?? article.slug;
  const description =
    article.articleType?.name ??
    siteDefaults.description;

  const cover = mediaUrl(article.coverImage?.url) || undefined;

  return {
    ...siteDefaults,
    title,
    description,
    openGraph: {
      ...siteDefaults.openGraph,
      title,
      description,
      images: cover
        ? [{ url: cover }]
        : siteDefaults.openGraph?.images,
    },
    twitter: {
      ...siteDefaults.twitter,
      title,
      description,
      images: cover
        ? [cover]
        : (siteDefaults.twitter as any)?.images,
    },
    alternates: {
      canonical: `${(siteDefaults.metadataBase ?? new URL("https://www.moto125.cc")).toString().replace(/\/$/, "")}/${article.slug}`,
    },
  };
}
