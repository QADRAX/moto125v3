import { Article } from "@moto125/api-client";
import FeaturedArticleCard from "./FeaturedArticleCard";

export function FeaturedHero({ article }: { article: Article }) {
  return <FeaturedArticleCard article={article} variant="hero" />;
}
