import rehypeShiki from "@shikijs/rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Options as SanitizeSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { TocItem } from "@/src/content/types";
import { rehypeExternalLinks } from "./rehype-external-links";
import { rehypeHeadingLinks } from "./rehype-heading-links";
import { remarkToc } from "./remark-toc";

const schema: SanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code || []),
      ["className", /^language-/],
    ],
    span: [...(defaultSchema.attributes?.span || []), ["style"], ["className"]],
    pre: [...(defaultSchema.attributes?.pre || []), ["className"], ["style"]],
    h2: [...(defaultSchema.attributes?.h2 || []), "id"],
    h3: [...(defaultSchema.attributes?.h3 || []), "id"],
    h4: [...(defaultSchema.attributes?.h4 || []), "id"],
    h5: [...(defaultSchema.attributes?.h5 || []), "id"],
    h6: [...(defaultSchema.attributes?.h6 || []), "id"],
    a: [...(defaultSchema.attributes?.a || []), "target", "rel"],
    input: [
      ...(defaultSchema.attributes?.input || []),
      "type",
      "checked",
      "disabled",
    ],
  },
};

function extractText(markdown: string): string {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const chunks: string[] = [];

  visit(tree, (node: any) => {
    if (node.type === "text" || node.type === "inlineCode") {
      chunks.push(String("value" in node ? node.value : ""));
    }
  });

  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

export async function renderMarkdown(
  markdown: string,
): Promise<{ html: string; toc: TocItem[]; excerpt: string }> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkToc)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeShiki, { theme: "catppuccin-latte" })
    .use(rehypeExternalLinks)
    .use(rehypeHeadingLinks)
    .use(rehypeStringify)
    .process(markdown);

  const text = extractText(markdown);
  const excerpt = text.length > 120 ? `${text.slice(0, 240).trim()}...` : text;

  return {
    html: String(file),
    toc: (file.data.toc as TocItem[] | undefined) ?? [],
    excerpt,
  };
}
