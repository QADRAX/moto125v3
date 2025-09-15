import { Article } from "@moto125/api-client";
import FeaturedArticleCard from "./FeaturedArticleCard";

export function FeaturedSmall({ article }: { article: Article }) {
  return <FeaturedArticleCard article={article} variant="small" />;
}
