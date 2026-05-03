export function MarkdownContent({ html }: { html: string }) {
  return (
    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
