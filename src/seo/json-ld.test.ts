import { describe, expect, it } from 'vitest'
import { collectionGraph, jsonLdScript, postGraph, siteGraph } from '~/seo/json-ld'

const post = {
  locale: 'en' as const,
  slug: '261020',
  title: 'How I built this blog',
  description: 'Notes on the stack',
  date: '2026-10-20T12:00:00+09:00',
  tags: ['Blog'],
  wordCount: 120,
  image: 'https://nabichan.me/og/en/261020.png',
}

type Node = Record<string, unknown>
const byType = (graph: Node[], type: string) => graph.filter((node) => node['@type'] === type)

describe('siteGraph', () => {
  it('WebSite 와 Person 을 @id 로 잇는다', () => {
    const graph = siteGraph('ko')
    const [website] = byType(graph, 'WebSite')
    const [person] = byType(graph, 'Person')
    expect(website).toMatchObject({ '@id': 'https://nabichan.me/#website', url: 'https://nabichan.me/', name: 'eunsol', publisher: { '@id': 'https://nabichan.me/#person' } })
    expect(person).toMatchObject({ '@id': 'https://nabichan.me/#person', name: 'eunsol (Nabi)', url: 'https://nabichan.me/' })
  })
})

describe('postGraph', () => {
  it('BlogPosting 을 Person·WebSite 참조로 잇고 Person 은 하나만 둔다', () => {
    const graph = postGraph(post)
    const [article] = byType(graph, 'BlogPosting')
    expect(article).toMatchObject({
      '@id': 'https://nabichan.me/en/261020#article',
      headline: 'How I built this blog',
      description: 'Notes on the stack',
      datePublished: '2026-10-20T12:00:00+09:00',
      dateModified: '2026-10-20T12:00:00+09:00',
      author: { '@id': 'https://nabichan.me/#person' },
      publisher: { '@id': 'https://nabichan.me/#person' },
      isPartOf: { '@id': 'https://nabichan.me/#website' },
      mainEntityOfPage: 'https://nabichan.me/en/261020',
      image: 'https://nabichan.me/og/en/261020.png',
      inLanguage: 'en',
      keywords: ['Blog'],
      wordCount: 120,
    })
    expect(byType(graph, 'Person')).toHaveLength(1)
  })

  it('updated 가 있으면 dateModified 로 쓴다', () => {
    const [article] = byType(postGraph({ ...post, updated: '2026-10-21T09:00:00+09:00' }), 'BlogPosting')
    expect(article.dateModified).toBe('2026-10-21T09:00:00+09:00')
  })

  it('경로 탐색은 처음 → 글 목록 → 글 순서이고 언어 경로를 쓴다', () => {
    const [breadcrumb] = byType(postGraph(post), 'BreadcrumbList')
    const items = breadcrumb.itemListElement as Node[]
    expect(items.map((item) => [item.position, item.item])).toEqual([
      [1, 'https://nabichan.me/en'],
      [2, 'https://nabichan.me/en/posts'],
      [3, 'https://nabichan.me/en/261020'],
    ])
  })
})

describe('collectionGraph', () => {
  it('CollectionPage 와 ItemList 로 글 목록을 낸다', () => {
    const graph = collectionGraph({ locale: 'ko', title: '글', posts: [{ slug: '261020', title: '첫 글' }, { slug: '261019', title: '둘째' }] })
    const [page] = byType(graph, 'CollectionPage')
    expect(page).toMatchObject({ '@id': 'https://nabichan.me/posts#page', url: 'https://nabichan.me/posts', name: '글', inLanguage: 'ko', isPartOf: { '@id': 'https://nabichan.me/#website' } })
    const [list] = byType(graph, 'ItemList')
    expect((list.itemListElement as Node[]).map((item) => [item.position, item.url, item.name])).toEqual([
      [1, 'https://nabichan.me/261020', '첫 글'],
      [2, 'https://nabichan.me/261019', '둘째'],
    ])
  })
})

describe('jsonLdScript', () => {
  it('< 를 \\u003c 로 바꿔 </script> 로 끊기지 않게 하고, 되돌리면 원래 값이다', () => {
    const script = jsonLdScript(postGraph({ ...post, title: 'a </script><b>' }))
    expect(script).not.toContain('<')
    const parsed = JSON.parse(script) as { '@context': string; '@graph': Node[] }
    expect(parsed['@context']).toBe('https://schema.org')
    expect(byType(parsed['@graph'], 'BlogPosting')[0].headline).toBe('a </script><b>')
  })
})
