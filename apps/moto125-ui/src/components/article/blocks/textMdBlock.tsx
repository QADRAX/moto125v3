export interface TextMdBlockProps {
  /** Raw markdown string */
  text?: string | null;
}
function MarkdownStub({ source }: { source?: string | null }) {
  if (!source) return null;
  return (
    <div className="markdown-raw rounded-xl bg-neutral-50 p-4 text-sm leading-relaxed">
      <pre className="whitespace-pre-wrap break-words">{source}</pre>
    </div>
  );
}

/**
 * Article content block: Markdown text (stubbed).
 */
export default function TextMdBlock({ text }: TextMdBlockProps) {
  return <MarkdownStub source={text} />;
}
