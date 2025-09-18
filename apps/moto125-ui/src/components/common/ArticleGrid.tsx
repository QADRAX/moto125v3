import "server-only";
import type { Article } from "@moto125/api-client";
import ArticleCard from "./ArticleCard";

export default function ArticleGrid({ articles }: { articles: Article[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
      {articles.map((a, i) => (
        <div
          key={a.documentId ?? a.id}
          className={`h-full ${i < 2 ? "lg:col-span-2" : ""}`}
        >
          <ArticleCard article={a} emphasis={i < 2} />
        </div>
      ))}
    </div>
  );
}