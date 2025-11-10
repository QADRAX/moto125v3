import "server-only";
import { getMirrorState } from "@/server/dataMirror";
import type { Config } from "@moto125/api-client";
import FooterTop from "./FooterTop";
import FooterLinks from "./FooterLinks";
import FooterSocial from "./FooterSocial";
import FooterBottom from "./FooterBottom";
import { mediaUrl } from "@/utils/utils";

export default async function Footer() {
  const state = await getMirrorState();
  const cfg: Config | undefined | null = state?.data?.config;

  const siteName = cfg?.siteName ?? "moto125-ui";
  const siteDescription =
    cfg?.openGraphDescription ??
    cfg?.metaDescriptionDefault ??
    "Comparativas, pruebas y datos de motos 125.";

  const logoUrl = mediaUrl(cfg?.logo?.url);
  const logoAlt = cfg?.logo?.alternativeText ?? siteName;

  const heroImg = mediaUrl(cfg?.heroBannerImage?.url);
  const heroTitle = cfg?.heroBannerTitle ?? null;
  const heroLink = cfg?.heroBannerSubtitle ?? null;

  return (
    <footer
      className="bg-white text-neutral-900 mt-12 border-primary border-t-2"
      itemScope
      itemType="https://schema.org/WPFooter"
    >
      <div className="mx-auto max-w-page px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <FooterTop
            siteName={siteName}
            siteDescription={siteDescription}
            logoUrl={logoUrl}
            logoAlt={logoAlt}
          />
          <FooterLinks />
          <FooterSocial
            siteName={siteName}
            heroImg={heroImg}
            heroTitle={heroTitle}
            heroLink={heroLink}
          />
        </div>
      </div>

      <FooterBottom siteName={siteName} />
    </footer>
  );
}
