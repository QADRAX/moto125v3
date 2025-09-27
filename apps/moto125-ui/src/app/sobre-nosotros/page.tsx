import type { Metadata } from "next";
import { getMirrorState } from "@/server/dataMirror";
import { buildSiteMetadataFromConfig } from "@/server/seo";
import Markdown from "@/components/markdown/Markdown";
import { Container } from "@/components/common/Container";

export async function generateMetadata(): Promise<Metadata> {
  const state = await getMirrorState();
  const cfg = state?.data?.config ?? null;
  const base = buildSiteMetadataFromConfig(cfg);

  return {
    ...base,
    title: "Sobre nosotros",
    alternates: { canonical: "/sobre-nosotros" },
    description: "Quiénes somos, qué hacemos y cómo trabajamos en moto125.cc.",
  };
}

export default async function AboutUsPage() {
  const state = await getMirrorState();
  const contentMd: string | undefined = state?.data?.pages?.aboutUs?.content;

  if (!contentMd || !contentMd.trim()) {
    // No content -> no render
    return null;
  }

  return (
    <Container>
        {
            contentMd && <Markdown source={contentMd} className="prose-neutral" />
        }
    </Container>
  );
}
