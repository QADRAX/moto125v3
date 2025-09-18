import "server-only";
import type { Article } from "@moto125/api-client";
import ArticleCard from "./ArticleCard";

type Props = {
  articles: Article[];
  allEmphasis?: boolean;
};

export default function ArticleGrid({ articles, allEmphasis = false }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
      {articles.map((a, i) => {
        const emphasis = allEmphasis || i < 2;
        const colSpan = emphasis || allEmphasis ? "lg:col-span-2" : "";
        return (
          <div key={a.documentId ?? a.id} className={`h-full ${colSpan}`}>
            <ArticleCard article={a} emphasis={emphasis} />
          </div>
        );
      })}
    </div>
  );
}
