import { getMirrorState } from "@/server/dataMirror";
import { pickLatestArticles } from "@/server/selectors";
import HomeFeatured from "@/components/home/homeFeatured/HomeFeatured";
import CategoryLatest from "@/components/home/categoryLatest/CategoryLatest";

export default async function Home() {
  const state = await getMirrorState();
  const latest = pickLatestArticles(state, 10);

  return (
    <>
      <HomeFeatured />

      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna grande (izquierda) */}
          <div className="lg:col-span-8 space-y-6">
            <CategoryLatest
              articleType="PRUEBAS"
              limit={10}
              headerText="ÚLTIMAS PRUEBAS"
            />
            <CategoryLatest
              articleType="ACTUALIDAD"
              limit={10}
              headerText="ÚLTIMAS NOVEDADES"
            />
            <CategoryLatest
              articleType="REPORTAJES"
              limit={10}
              headerText="ÚLTIMOS REPORTAJES"
            />
          </div>

          {/* Columna pequeña (derecha) */}
          <aside className="lg:col-span-4 space-y-6">
          </aside>
        </div>
      </section>
    </>
  );
}
