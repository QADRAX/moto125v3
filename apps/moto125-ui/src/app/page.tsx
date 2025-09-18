import HomeFeatured from "@/components/home/homeFeatured/HomeFeatured";
import CategoryLatest from "@/components/home/categoryLatest/CategoryLatest";

export default async function Home() {
  return (
    <>
      <HomeFeatured />

      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 sm:py-8">
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
      </section>
    </>
  );
}
