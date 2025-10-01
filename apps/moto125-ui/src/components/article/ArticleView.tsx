import type { Article } from "@moto125/api-client";
import ArticleHeader from "./ArticleHeader";
import ArticleFooter from "./ArticleFooter";
import ArticleContent from "./ArticleContentBlock";
import { Container } from "../common/Container";
import RelatedArticlesCarousel from "./RelatedArticlesCarousel";
import MarkArticleAsViewed from "./MarkArticleAsViewed";

export interface ArticleViewProps {
  article: Article;
}

export default function ArticleView({ article }: ArticleViewProps) {
  return (
    <>
      <ArticleHeader article={article} />
      <Container>
        <ArticleContent blocks={article.content} youtubeLink={article.youtubeLink} youtubeTitle={article.title ?? article.slug} />
        <ArticleFooter article={article} />
      </Container>
      <Container className="max-w-screen-xl">
        <RelatedArticlesCarousel article={article}/>
      </Container>
      <MarkArticleAsViewed slug={article.slug}/>
    </>
  );
}
