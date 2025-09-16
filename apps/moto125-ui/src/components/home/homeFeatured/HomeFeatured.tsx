import "server-only";

import { getMirrorState } from "@/server/dataMirror";
import { pickLatestArticles } from "@/server/selectors";
import { Article } from "@moto125/api-client";
import { FeaturedHero } from "./FeaturedHero";
import { FeaturedSmall } from "./FeaturedSmall";

export default async function HomeFeatured() {
  const state = await getMirrorState();
  const latest: Article[] = pickLatestArticles(state, 4) as any[];

  if (!state || latest.length === 0) return null;

  const [first, ...rest] = latest;

  return (
    <section
      aria-label="Destacados"
      className="mx-auto max-w-page max-w-screen-xl"
    >
      <FeaturedHero article={first} />

      {rest.length > 0 && (
        <div className="mt-1 sm:mt-1 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-1">
          {rest.map((a) => (
            <FeaturedSmall key={a.documentId ?? a.id} article={a} />
          ))}
        </div>
      )}
    </section>
  );
}
