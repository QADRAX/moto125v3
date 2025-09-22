import "server-only";
import { getMirrorState } from "@/server/dataMirror";
import type { ArticleType, Config } from "@moto125/api-client";
import HeaderBrand from "./HeaderBrand";
import HeaderHero from "./HeaderHero";
import HeaderNav from "./HeaderNav";
import { mediaUrl } from "@/utils/utils";
import MobileHeader from "./MobileHeader";

function pickHeaderData(state: Awaited<ReturnType<typeof getMirrorState>>) {
  const cfg: Config | undefined | null = state?.data?.config;
  const types: ArticleType[] =
    state?.data?.taxonomies?.articleTypes?.slice()?.sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", "es", {
        sensitivity: "base",
      })
    ) ?? [];
  return { cfg, types };
}

export default async function Header() {
  const state = await getMirrorState();
  const { cfg, types } = pickHeaderData(state);

  const siteName = cfg?.siteName ?? "moto125-ui";
  const logoUrl = mediaUrl(cfg?.logo?.url);
  const heroImg = mediaUrl(cfg?.heroBannerImage?.url);
  const heroTitle = cfg?.heroBannerTitle ?? null;
  const heroLink = cfg?.heroBannerSubtitle ?? null;

  const hasHero = Boolean(heroImg);

  return (
    <header
      id="main-header"
      className="z-50 bg-white border-b-3 border-primary mx-auto max-w-page px-4 sm:px-6"
    >
      <div className="md:hidden">
        <MobileHeader />
      </div>

      <div className={`hidden md:block mx-auto w-full`}>
        {hasHero ? (
          <>
            <div className="flex items-center gap-6 justify-between">
              <HeaderBrand
                siteName={siteName}
                logoUrl={logoUrl}
                alt={cfg?.logo?.alternativeText}
              />
              <HeaderHero
                imgUrl={heroImg}
                title={heroTitle}
                linkUrl={heroLink}
                siteName={siteName}
              />
            </div>
            <HeaderNav types={types} />
          </>
        ) : (
          <div className="h-12 hidden sm:flex items-center gap-4">
            <HeaderBrand
              siteName={siteName}
              logoUrl={logoUrl}
              alt={cfg?.logo?.alternativeText}
            />
            <div className="flex-1 min-w-0">
              <HeaderNav types={types} layout="stacked" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
