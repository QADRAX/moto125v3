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

      <CategoryLatest articleType="PRUEBAS" limit={10} headerText="ÚLTIMAS PRUEBAS" />
      <CategoryLatest articleType="ACTUALIDAD" limit={10} headerText="ÚLTIMAS NOVEDADES" />
      <CategoryLatest articleType="REPORTAJES" limit={10} headerText="ÚLTIMOS REPORTAJES" />
    </>
  );
}
