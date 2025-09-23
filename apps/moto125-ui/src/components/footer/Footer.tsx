import "server-only";
import Link from "next/link";
import { getMirrorState } from "@/server/dataMirror";
import type { Config } from "@moto125/api-client";
import { mediaUrl, isExternalUrl } from "@/utils/utils";
import { YouTubeIcon } from "./YoutubeIcon";

type FooterProps = {
  aboutHref?: string;
  youtubeUrl?: string | null;
};

export default async function Footer({
  aboutHref = "/sobre-nosotros",
  youtubeUrl = "https://www.youtube.com/@Moto125ccTV",
}: FooterProps) {
  const state = await getMirrorState();
  const cfg: Config | undefined | null = state?.data?.config;

  const siteName = cfg?.siteName ?? "moto125-ui";
  const siteDescription =
    cfg?.openGraphDescription ??
    cfg?.metaDescriptionDefault ??
    "Comparativas, pruebas y datos de motos 125.";

  const logoUrl = mediaUrl(cfg?.logo?.url);
  const logoAlt = cfg?.logo?.alternativeText ?? siteName;

  // Banner hero opcional en footer
  const heroImg = mediaUrl(cfg?.heroBannerImage?.url);
  const heroTitle = cfg?.heroBannerTitle ?? null;
  const heroLink = cfg?.heroBannerSubtitle ?? null;

  const yt = youtubeUrl ?? process.env.NEXT_PUBLIC_YOUTUBE_URL ?? null;
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-black text-white mt-12 border-primary border-t-2"
      itemScope
      itemType="https://schema.org/WPFooter"
    >
      <div className="mx-auto max-w-page px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <section>
            <h2 className="sr-only">Sobre el sitio</h2>

            <Link
              href="/"
              aria-label={siteName}
              className="inline-flex items-center bg-white shadow-sm ring-white/20"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  className="h-12 sm:h-14 w-auto"
                  loading="lazy"
                />
              ) : (
                <span className="text-xl font-heading font-semibold text-black">
                  {siteName}
                </span>
              )}
            </Link>

            {siteDescription && (
              <p className="mt-3 text-sm text-white/80 max-w-prose" itemProp="description">
                {siteDescription}
              </p>
            )}
          </section>

          <nav aria-label="Enlaces" className="sm:justify-self-center">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3">Enlaces</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/motos" className="hover:underline">
                  Motos
                </Link>
              </li>
              <li>
                <Link href="/marcas" className="hover:underline">
                  Marcas
                </Link>
              </li>
              <li>
                <Link href="/articulos" className="hover:underline">
                  Artículos
                </Link>
              </li>
              <li>
                <Link href={aboutHref} className="hover:underline">
                  Sobre nosotros
                </Link>
              </li>
            </ul>
          </nav>

          <section className="lg:justify-self-end">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3">
              Síguenos
            </h2>
            <ul className="space-y-2">
              {yt && (
                <li>
                  <a
                    href={yt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:underline"
                    aria-label="Visitar nuestro canal de YouTube"
                  >
                    <YouTubeIcon className="w-5 h-5" />
                    <span>YouTube</span>
                  </a>
                </li>
              )}
            </ul>

            {heroImg && (
              <div className="mt-5">
                {heroLink ? (
                  isExternalUrl(heroLink) ? (
                    <a
                      href={heroLink}
                      title={heroTitle ?? siteName}
                      aria-label={heroTitle ?? siteName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <img
                        src={heroImg}
                        alt={heroTitle ?? siteName}
                        title={heroTitle ?? siteName}
                        className="h-24 sm:h-28 w-auto object-contain bg-white rounded-lg border border-white/10 p-2 shadow-sm"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <Link
                      href={heroLink}
                      title={heroTitle ?? siteName}
                      aria-label={heroTitle ?? siteName}
                      className="inline-block"
                    >
                      <img
                        src={heroImg}
                        alt={heroTitle ?? siteName}
                        title={heroTitle ?? siteName}
                        className="h-24 sm:h-28 w-auto object-contain bg-white rounded-lg border border-white/10 p-2 shadow-sm"
                        loading="lazy"
                      />
                    </Link>
                  )
                ) : (
                  <img
                    src={heroImg}
                    alt={heroTitle ?? siteName}
                    title={heroTitle ?? siteName}
                    className="h-24 sm:h-28 w-auto object-contain bg-white rounded-lg border border-white/10 p-2 shadow-sm"
                    loading="lazy"
                  />
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-page px-4 sm:px-6 py-4 text-xs text-white/70 flex flex-wrap items-center justify-center">
          <span>© {year} {siteName}</span>
        </div>
      </div>
    </footer>
  );
}
