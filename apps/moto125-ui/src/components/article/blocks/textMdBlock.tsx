import Markdown from "@/components/markdown/Markdown";

export interface TextMdBlockProps {
  text?: string | null;
}

export default function TextMdBlock({ text }: TextMdBlockProps) {
  return <Markdown source={text} />;
}
