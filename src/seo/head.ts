import { DESCRIPTION_MAX, site } from '~/shared/config'
import type { Locale } from '~/shared/i18n'
import { localizePath } from '~/entities/post'
import { type Graph, jsonLdScript } from '~/seo/json-ld'
import { truncateMeta } from '~/seo/text'
import { pageUrl } from '~/seo/url'

export type HeadInput = {
  locale: Locale
  // 언어 접두사 없는 경로 ('/', '/posts', '/261020')
  path: string
  // <title> 그대로. 템플릿(… | eunsol)은 호출하는 쪽이 붙인다
  title: string
  description?: string
  type: 'website' | 'article'
  // 절대 URL
  image: string
  // 이 페이지가 실제로 있는 언어. hreflang 은 이 쌍끼리만 단다
  alternates: Locale[]
  published?: string
  modified?: string
  tags?: string[]
  jsonLd: Graph
  // 글이면 '/261020.md'. 언어 접두사는 여기서 붙인다
  markdownPath?: string
}

type Tag = Record<string, string>

// TanStack head() 가 그대로 돌려줄 메타·링크·스크립트 (스펙 4.9)
export function pageHead(input: HeadInput): { meta: Tag[]; links: Tag[]; scripts: Array<{ type: string; children: string }> } {
  const url = pageUrl(input.path, input.locale)
  const description = input.description === undefined ? undefined : truncateMeta(input.description, DESCRIPTION_MAX)
  const others = input.alternates.filter((locale) => locale !== input.locale)

  const meta: Tag[] = [
    { title: input.title },
    ...(description === undefined ? [] : [{ name: 'description', content: description }]),
    { property: 'og:site_name', content: site.name },
    { property: 'og:type', content: input.type },
    { property: 'og:title', content: input.title },
    ...(description === undefined ? [] : [{ property: 'og:description', content: description }]),
    { property: 'og:url', content: url },
    { property: 'og:image', content: input.image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: input.title },
    { property: 'og:locale', content: site.ogLocales[input.locale] },
    ...others.map((locale) => ({ property: 'og:locale:alternate', content: site.ogLocales[locale] })),
    ...(input.type === 'article' && input.published !== undefined
      ? [
          { property: 'article:published_time', content: input.published },
          { property: 'article:modified_time', content: input.modified ?? input.published },
          ...(input.tags ?? []).map((tag) => ({ property: 'article:tag', content: tag })),
        ]
      : []),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: input.title },
    ...(description === undefined ? [] : [{ name: 'twitter:description', content: description }]),
    { name: 'twitter:image', content: input.image },
  ]

  const links: Tag[] = [
    { rel: 'canonical', href: url },
    ...input.alternates.map((locale) => ({ rel: 'alternate', hrefLang: locale, href: pageUrl(input.path, locale) })),
    { rel: 'alternate', hrefLang: 'x-default', href: pageUrl(input.path, 'ko') },
    ...(input.markdownPath === undefined
      ? []
      : [{ rel: 'alternate', type: 'text/markdown', href: localizePath(input.markdownPath, input.locale) }]),
  ]

  return { meta, links, scripts: [{ type: 'application/ld+json', children: jsonLdScript(input.jsonLd) }] }
}
