import { type Locale, m } from '~/shared/i18n'
import { site } from '~/shared/config'
import { absoluteUrl, pageUrl } from './url'

// 구조화 데이터 (스펙 4.9). 노드는 @graph 하나에 넣고 @id 로 잇는다. Person 은 siteGraph 한 곳에서만 만든다
export type Graph = Record<string, unknown>[]

const WEBSITE_ID = `${absoluteUrl('/')}#website`
const PERSON_ID = `${absoluteUrl('/')}#person`

export function siteGraph(locale: Locale): Graph {
  return [
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: absoluteUrl('/'),
      name: site.name,
      description: m.site_description({}, { locale }),
      inLanguage: ['ko', 'en'],
      publisher: { '@id': PERSON_ID },
    },
    { '@type': 'Person', '@id': PERSON_ID, name: site.author, url: absoluteUrl('/') },
  ]
}

export function postGraph(input: {
  locale: Locale
  slug: string
  title: string
  description: string
  date: string
  updated?: string
  tags: string[]
  wordCount: number
  image: string
}): Graph {
  const url = pageUrl(`/${input.slug}`, input.locale)
  return [
    ...siteGraph(input.locale),
    {
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      headline: input.title,
      description: input.description,
      datePublished: input.date,
      dateModified: input.updated ?? input.date,
      author: { '@id': PERSON_ID },
      publisher: { '@id': PERSON_ID },
      isPartOf: { '@id': WEBSITE_ID },
      mainEntityOfPage: url,
      image: input.image,
      inLanguage: input.locale,
      keywords: input.tags,
      wordCount: input.wordCount,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: site.name, item: pageUrl('/', input.locale) },
        { '@type': 'ListItem', position: 2, name: m.posts_title({}, { locale: input.locale }), item: pageUrl('/posts', input.locale) },
        { '@type': 'ListItem', position: 3, name: input.title, item: url },
      ],
    },
  ]
}

export function collectionGraph(input: { locale: Locale; title: string; posts: Array<{ slug: string; title: string }> }): Graph {
  const url = pageUrl('/posts', input.locale)
  return [
    ...siteGraph(input.locale),
    { '@type': 'CollectionPage', '@id': `${url}#page`, url, name: input.title, inLanguage: input.locale, isPartOf: { '@id': WEBSITE_ID } },
    {
      '@type': 'ItemList',
      itemListElement: input.posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: pageUrl(`/${post.slug}`, input.locale),
        name: post.title,
      })),
    },
  ]
}

// <script> 안에 싣는 문자열이라 < 를 이스케이프해서 </script> 로 끊기지 않게 한다
export function jsonLdScript(graph: Graph): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')
}
