import HomeFeatured from "@/components/home/homeFeatured/HomeFeatured";
import CategoryLatest from "@/components/home/categoryLatest/CategoryLatest";
import { Container } from "@/components/common/Container";

export default async function Home() {
  return (
    <>
      <HomeFeatured />

      <Container>
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
            articleType="INICIACIÓN"
            limit={10}
            headerText="ÚLTIMOS REPORTAJES"
          />
      </Container>
    </>
  );
}
