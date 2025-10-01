import type { Article, Company, Moto } from "@moto125/api-client";
import ArticleHeader from "./ArticleHeader";
import ArticleFooter from "./ArticleFooter";
import ArticleContent from "./ArticleContent";
import { Container } from "../common/Container";
import RelatedArticlesCarousel from "./RelatedArticlesCarousel";
import MarkArticleAsViewed from "./MarkArticleAsViewed";

export interface ArticleViewProps {
  article: Article;
}

export default function ArticleView({ article }: ArticleViewProps) {
  const motos = (article.relatedMotos ?? []) as Moto[];
  const companies = (article.relatedCompanies ?? []) as Company[];
  return (
    <>
      <ArticleHeader article={article} />
      <Container>
        <ArticleContent
          blocks={article.content}
          youtubeLink={article.youtubeLink}
          youtubeTitle={article.title ?? article.slug}
          motos={motos}
          companies={companies}
        />
        <ArticleFooter article={article} />
      </Container>
      <RelatedArticlesCarousel article={article} />
      <MarkArticleAsViewed slug={article.slug} />
    </>
  );
}
