import { getMirrorState } from "@/server/dataMirror";
import { pickLatestArticles } from "@/server/selectors";
import ArticleCard from "@/components/ArticleCard";

export default async function Home() {
  const state = await getMirrorState();
  const latest = pickLatestArticles(state, 10);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Últimos artículos</h1>

      {!state && (
        <p>Inicializando cache…</p>
      )}

      {state && latest.length === 0 && (
        <p>No hay artículos disponibles.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16
        }}
      >
        {latest.map((a) => (
          <ArticleCard key={a.documentId ?? a.id} article={a} />
        ))}
      </div>
    </main>
  );
}
