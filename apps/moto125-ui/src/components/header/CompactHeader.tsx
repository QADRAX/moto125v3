import "server-only";
import { getMirrorState } from "@/server/dataMirror";
import type { ArticleType, Config } from "@moto125/api-client";
import HeaderNav from "./HeaderNav";
import HeaderBrand from "./HeaderBrand";
import { mediaUrl } from "@/utils/utils";
import MobileHeader from "./MobileHeader";

function pickHeaderData(state: Awaited<ReturnType<typeof getMirrorState>>) {
  const cfg: Config | undefined | null = state?.data?.config;
  const types: ArticleType[] =
    state?.data?.taxonomies?.articleTypes
      ?.slice()
      ?.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "es", {
          sensitivity: "base",
        })
      ) ?? [];
  return { cfg, types };
}

export default async function CompactHeader() {
  const state = await getMirrorState();
  const { cfg, types } = pickHeaderData(state);

  const siteName = cfg?.siteName ?? "moto125-ui";
  const logoUrl = mediaUrl(cfg?.logo?.url);

  return (
    <div
      className="compact-header bg-white border-b-3 border-primary"
      aria-hidden="true"
    >
      <div className="mx-auto max-w-page px-4 sm:px-6">
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
        <div className="sm:hidden">
          <MobileHeader />
        </div>
      </div>
    </div>
  );
}
