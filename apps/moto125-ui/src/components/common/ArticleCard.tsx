import "server-only";
import type { Article } from "@moto125/api-client";
import ArticleBody from "./ArticleBody";
import ArticleImage from "./ArticleImage";

export default function ArticleCard({
  article,
  emphasis = false,
}: {
  article: Article;
  emphasis?: boolean;
}) {
  return (
    <article className="group relative w-full h-full overflow-hidden flex flex-col">
      <ArticleImage article={article} emphasis={emphasis} />
      <ArticleBody article={article} emphasis={emphasis} />
    </article>
  );
}
