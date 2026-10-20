import type { Locale } from '~/i18n/runtime'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { VFile } from 'vfile'
import { rehypeFigure } from './rehype-figure'
import { rehypeLinks } from './rehype-links'
import { rehypeLocalImages } from './rehype-local-images'
import { type TocItem, rehypeToc } from './rehype-toc'
import { remarkCallouts } from './remark-callouts'
import { remarkDetails } from './remark-details'
import { remarkDirectiveGuard } from './remark-directive-guard'
import { remarkQuote } from './remark-quote'
import { remarkSeeAlso } from './remark-see-also'
import { type Glossary, type GlossaryEntry, remarkTerm } from './remark-term'
import { remarkWidget } from './remark-widget'

export type { Glossary, GlossaryEntry, TocItem }

export type RenderOptions = {
  filePath: string
  slug: string
  locale: Locale
  enSlugs: ReadonlySet<string>
  glossary: Glossary
  widgetNames: readonly string[]
}

export type Asset =
  | { kind: 'copy'; from: string; to: string }
  | { kind: 'webp'; from: string; to: string; width: number }

export type RenderResult = { html: string; toc: TocItem[]; assets: Asset[]; terms: string[] }

// 글 본문을 빌드 시점에 HTML 로 만든다. 런타임에는 파서도 하이라이터도 없다
export async function renderMarkdown(markdown: string, opts: RenderOptions): Promise<RenderResult> {
  const file = new VFile({ value: markdown, path: opts.filePath })
  const result = await unified()
    .use(remarkParse)
    // 물결 하나는 '10~20분' 같은 한국어 범위 표기라 취소선으로 보지 않는다
    .use(remarkGfm, { singleTilde: false })
    .use(remarkDirective)
    .use(remarkDirectiveGuard)
    .use(remarkDetails)
    .use(remarkSeeAlso)
    .use(remarkQuote, { locale: opts.locale })
    .use(remarkTerm, { locale: opts.locale, glossary: opts.glossary })
    .use(remarkWidget, { names: opts.widgetNames })
    .use(remarkCallouts, { locale: opts.locale })
    // 원본 HTML 은 허용하지 않는다 (allowDangerousHtml 을 쓰지 않음)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeToc)
    .use(rehypeLocalImages, { filePath: opts.filePath, slug: opts.slug })
    .use(rehypeFigure)
    .use(rehypeLinks, { locale: opts.locale, enSlugs: opts.enSlugs })
    .use(rehypePrettyCode, { theme: 'github-light' })
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeStringify)
    .process(file)
  return {
    html: String(result),
    toc: result.data.toc ?? [],
    assets: result.data.assets ?? [],
    terms: result.data.terms ?? [],
  }
}
