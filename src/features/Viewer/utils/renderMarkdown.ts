import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkGithubBetaBlockquoteAdmonitions from 'remark-github-beta-blockquote-admonitions'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeShiki from '@shikijs/rehype'
import * as shikiTransformers from '@shikijs/transformers'
import rehypeStringify from 'rehype-stringify'
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
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeShiki, {
      themes: {
        light: 'one-light',
        dark: 'one-dark-pro',
      },
      transformers: [
        shikiTransformers.transformerNotationDiff(),
        shikiTransformers.transformerNotationHighlight(),
        shikiTransformers.transformerNotationWordHighlight(),
        shikiTransformers.transformerNotationFocus(),
        shikiTransformers.transformerMetaHighlight(),
      ],
    })
    .use(rehypeStringify, {
      allowDangerousHtml: true,
    })
    .process(markdown)
}
