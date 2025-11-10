import type { ArticleContentBlock, Company, Moto } from "@moto125/api-client";
import TextMdBlock from "./blocks/textMdBlock";
import ImageGridBlock from "./blocks/ImageGridBlock";
import FortDebBlock from "./blocks/FortDebItem";
import PrestacionesBlock from "./blocks/PrestacionesBlock";
import YouTubeEmbed from "../common/YouTubeEmbed";
import SectionHeader from "../common/SectionHeader";
import MotoCard from "../motos/MotoCard";
import BrandCard from "../brands/BrandCard";

export interface ArticleContentProps {
  blocks?: ArticleContentBlock[] | null;
  youtubeLink?: string | null;
  youtubeTitle?: string | null;
  motos?: Moto[] | null;
  companies?: Company[] | null;
}

export default function ArticleContent({
  blocks,
  youtubeTitle,
  youtubeLink,
  motos,
  companies
}: ArticleContentProps) {
  if (!blocks?.length) {
    return <p className="opacity-70"></p>;
  }

  return (
    <section className="space-y-6">
      {blocks.map((block) => {
        switch (block.__component) {
          case "article-content.text-content": {
            const text: string | undefined = block?.Text;
            return (
              <div key={`b-${block.id}`}>
                <TextMdBlock text={text} />
              </div>
            );
          }
          case "article-content.image-grid-content": {
            return <ImageGridBlock key={`b-${block.id}`} />;
          }
          case "article-content.fortalezas-debilidades": {
            const { Fortalezas, Debilidades } = block ?? {};
            return (
              <FortDebBlock
                key={`b-${block.id}`}
                fortalezas={Fortalezas}
                debilidades={Debilidades}
              />
            );
          }
          case "article-content.prestaciones": {
            const prestaciones = block?.prestaciones ?? {};
            return (
              <PrestacionesBlock
                key={`b-${block.id}`}
                prestaciones={prestaciones}
              />
            );
          }
          default:
            return null;
        }
      })}
      {youtubeLink ? (
        <>
          <SectionHeader title="Vídeo de Youtube" />
          <section className="mb-6">
            <YouTubeEmbed src={youtubeLink} title={youtubeTitle} />
          </section>
        </>
      ) : null}

      {motos?.length ? (
        <section>
          <SectionHeader title="Motos de este artículo" />
          <div className="flex flex-wrap justify-center gap-4">
            {motos!.map((m) => (
              <div key={m.id} className="w-full max-w-[300px]">
                <MotoCard moto={m} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {companies?.length ? (
        <section>
          <SectionHeader title="Marcas de este artículo" />
          <div className="flex flex-wrap justify-center gap-4">
            {companies!.map((c) => (
              <div key={c.id} className="w-full max-w-[300px]">
                <BrandCard company={c} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
