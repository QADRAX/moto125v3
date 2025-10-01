"use server";

import "server-only";
import type { Article } from "@moto125/api-client";
import ArticleCard from "../common/ArticleCard";
import { getMirrorState } from "@/server/dataMirror";
import Link from "next/link";
import SectionHeader from "../common/SectionHeader";
import { selectRelatedArticles } from "./RelatedArticlesCarousel.selector";
import AutoCarousel from "../common/AutoCarousel";
import { cookies } from "next/headers";
import { parseSlugCsv, viewedCookieNameToday } from "@/utils/viewedArticles";
import { Container } from "../common/Container";

export interface RelatedArticlesCarouselProps {
  article: Article;
  minItems?: number;
  maxItems?: number;
  intervalMs?: number;
}

export default async function RelatedArticlesCarousel({
  article,
  minItems = 14,
  maxItems = 28,
  intervalMs = 5000,
}: RelatedArticlesCarouselProps) {
  const state = await getMirrorState();
  const allArticles = (state.data.articles ?? []) as Article[];

  const safeMin = Math.max(1, Math.min(minItems, 48));
  const safeMax = Math.max(safeMin, Math.min(maxItems, 64));

  const cookieName = viewedCookieNameToday();
  const raw = cookies().get(cookieName)?.value;
  const viewed = parseSlugCsv(raw);

  const pool = allArticles.filter((a) => !viewed.has(a.slug));

  const items = selectRelatedArticles(pool, article, safeMin, safeMax);
  if (!items.length) return null;

  return (
    <>
      <Container className="mt-10">
        <SectionHeader
          title="te puede interesar"
          action={
            <Link
              href={`/articulos`}
              className="hidden sm:inline-block text-sm font-heading uppercase text-[var(--color-primary)] hover:underline"
            >
              Ver más
            </Link>
          }
        />
      </Container>
      <Container className="max-w-screen-xl">
        <AutoCarousel
          ariaLabel="Artículos relacionados"
          intervalMs={intervalMs}
          pauseOnTouchDrag
          snap
        >
          {items.map((a) => (
            <ArticleCard key={a.id} article={a} emphasis />
          ))}
        </AutoCarousel>
      </Container>
    </>
  );
}
