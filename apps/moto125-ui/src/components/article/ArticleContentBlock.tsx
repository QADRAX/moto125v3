import type { ArticleContentBlock } from "@moto125/api-client";
import TextMdBlock from "./blocks/textMdBlock";
import ImageGridBlock from "./blocks/ImageGridBlock";
import FortDebBlock from "./blocks/FortDebItem";
import PrestacionesBlock from "./blocks/PrestacionesBlock";

export interface ArticleContentProps {
  blocks?: ArticleContentBlock[] | null;
}

export default function ArticleContent({ blocks }: ArticleContentProps) {
  if (!blocks?.length) {
    return <p className="opacity-70">No content available.</p>;
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
    </section>
  );
}
