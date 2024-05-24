import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkGithubBetaBlockquoteAdmonitions from 'remark-github-beta-blockquote-admonitions'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import rehypeShiki from '@shikijs/rehype'
import { capitalize, lowerCase } from 'lodash-es'

export function renderMarkdown(markdown: string) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkGithubBetaBlockquoteAdmonitions, {
      classNameMaps: {
        block: (type) => `markdown-alert markdown-alert-${type.toLowerCase()}`,
        title: 'markdown-alert-title',
      },
      titleTextMap: (title: string) => ({
        displayTitle: capitalize(title.slice(2, -1)),
        checkedTitle: lowerCase(title.slice(2, -1)),
      }),
    })
    .use(remarkRehype)
    .use(rehypeSanitize, {
      attributes: {
        '*': ['className'],
      },
    })
    .use(rehypeShiki, {
      themes: {
        light: 'one-light',
        dark: 'one-dark-pro',
      },
    })
    .use(rehypeStringify)
    .process(markdown)
}
