import { getMirrorState } from "@/server/dataMirror";
import { pickLatestArticles } from "@/server/selectors";
import ArticleCard from "@/components/ArticleCard";
import HomeFeatured from "@/components/home/HomeFeatured";

export default async function Home() {
  const state = await getMirrorState();
  const latest = pickLatestArticles(state, 10);

  return (
    <>
      <HomeFeatured />

      <section className="mx-auto max-w-page px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-2xl font-heading mb-4">Últimos artículos</h2>

        {!state && <p>Inicializando cache…</p>}
        {state && latest.length === 0 && <p>No hay artículos disponibles.</p>}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {latest.map((a: any) => (
            <ArticleCard key={a.documentId ?? a.id} article={a} />
          ))}
        </div>
      </section>
    </>
  );
}
