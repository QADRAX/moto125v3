import "server-only";
import { getMirrorState } from "@/server/dataMirror";
import type { ArticleType, Config } from "@moto125/api-client";
import HeaderNav from "./HeaderNav";

function pickHeaderData(state: Awaited<ReturnType<typeof getMirrorState>>) {
  const cfg: Config | undefined | null = state?.data?.config;
  const types: ArticleType[] =
    state?.data?.taxonomies?.articleTypes?.slice()?.sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" })
    ) ?? [];
  return { cfg, types };
}

export default async function CompactHeader() {
  const state = await getMirrorState();
  const { types } = pickHeaderData(state);

  return (
    <div
      className="compact-header bg-white border-b-3 border-primary"
      aria-hidden="true"
    >
      <div className="mx-auto max-w-page px-4 sm:px-6">
        <div className="h-12 hidden sm:flex items-center justify-center">
          <HeaderNav types={types} />
        </div>
      </div>
    </div>
  );
}
