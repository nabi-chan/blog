export function MarkdownContent({ html }: { html: string }) {
  return (
    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

const dividerPattern =
  /(?:<p>\s*)?<span class="markdown-divider"><\/span>(?:\s*<\/p>)?/gi;

export function MarkdownCards({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const sections = html
    .split(dividerPattern)
    .map((section) => section.trim())
    .filter(Boolean);

  return (
    <div className={className ? `${className} space-y-8` : "space-y-8"}>
      {sections.map((section, index) => (
        <div className="memo-card rotate-0" key={index}>
          <MarkdownContent html={section} />
        </div>
      ))}
    </div>
  );
}
