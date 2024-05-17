import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import rehypeShiki from '@shikijs/rehype'

export function useRenderMarkdownToHTMLQueryObject(markdown: string) {
  return {
    queryKey: ['renderMarkdownToHTML', markdown],
    queryFn: () =>
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeSanitize)
        .use(rehypeShiki, {
          themes: {
            light: 'one-light',
            dark: 'one-dark-pro',
          },
        })
        .use(rehypeStringify)
        .process(markdown),
  }
}
