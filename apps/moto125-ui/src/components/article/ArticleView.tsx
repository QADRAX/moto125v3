import type { Article } from "@moto125/api-client";
import ArticleHeader from "./ArticleHeader";
import ArticleFooter from "./ArticleFooter";
import ArticleContent from "./ArticleContentBlock";

export interface ArticleViewProps {
  article: Article;
}

export default function ArticleView({ article }: ArticleViewProps) {
  return (
    <>
      <ArticleHeader article={article} />
      <article className="container mx-auto max-w-3xl px-4 py-8">
        <ArticleContent blocks={article.content} />
        <ArticleFooter article={article} />
      </article>
    </>
  );
}
