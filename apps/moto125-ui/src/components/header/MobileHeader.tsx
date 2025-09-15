import "server-only";
import { getMirrorState } from "@/server/dataMirror";
import type { ArticleType, Config } from "@moto125/api-client";
import { mediaUrl } from "@/utils/utils";
import MobileHeaderClient from "./MobileHeaderClient";

function pickHeaderData(state: Awaited<ReturnType<typeof getMirrorState>>) {
  const cfg: Config | undefined | null = state?.data?.config;
  const types: ArticleType[] =
    state?.data?.taxonomies?.articleTypes?.slice()?.sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" })
    ) ?? [];
  return { cfg, types };
}

export default async function MobileHeader() {
  const state = await getMirrorState();
  const { cfg, types } = pickHeaderData(state);

  const siteName = cfg?.siteName ?? "moto125-ui";
  const logoUrl = mediaUrl(cfg?.logo?.url);

  return (
    <MobileHeaderClient
      siteName={siteName}
      logoUrl={logoUrl}
      types={types}
    />
  );
}
