import { describe, expect, it } from 'vitest'
import { type HeadInput, pageHead } from './head'
import { siteGraph } from './json-ld'

const base: HeadInput = {
  locale: 'en',
  path: '/261020',
  title: 'How I built this blog',
  description: 'Notes on the stack',
  type: 'article',
  image: 'https://nabichan.me/og/en/261020.png',
  alternates: ['ko', 'en'],
  published: '2026-10-20T12:00:00+09:00',
  jsonLd: siteGraph('en'),
  markdownPath: '/261020.md',
}

const metaValue = (head: ReturnType<typeof pageHead>, key: string) =>
  head.meta.filter((meta) => meta.name === key || meta.property === key).map((meta) => meta.content)

describe('pageHead', () => {
  it('제목은 meta 에 한 번만 있다', () => {
    expect(pageHead(base).meta.filter((meta) => 'title' in meta)).toEqual([{ title: 'How I built this blog' }])
  })

  it('번역 쌍이 있는 en 글: canonical, hreflang 3개, markdown alternate', () => {
    const { links } = pageHead(base)
    expect(links.filter((link) => link.rel === 'canonical')).toEqual([{ rel: 'canonical', href: 'https://nabichan.me/en/261020' }])
    expect(links.filter((link) => link.hrefLang)).toEqual([
      { rel: 'alternate', hrefLang: 'ko', href: 'https://nabichan.me/261020' },
      { rel: 'alternate', hrefLang: 'en', href: 'https://nabichan.me/en/261020' },
      { rel: 'alternate', hrefLang: 'x-default', href: 'https://nabichan.me/261020' },
    ])
    expect(links.filter((link) => link.type === 'text/markdown')).toEqual([{ rel: 'alternate', type: 'text/markdown', href: '/en/261020.md' }])
  })

  it('번역이 없는 ko 글은 ko 와 x-default 만 달고 og:locale:alternate 가 없다', () => {
    const head = pageHead({ ...base, locale: 'ko', alternates: ['ko'] })
    expect(head.links.filter((link) => link.hrefLang).map((link) => link.hrefLang)).toEqual(['ko', 'x-default'])
    expect(metaValue(head, 'og:locale')).toEqual(['ko_KR'])
    expect(metaValue(head, 'og:locale:alternate')).toEqual([])
  })

  it('OG·Twitter·article 메타를 단다', () => {
    const head = pageHead(base)
    expect(metaValue(head, 'og:type')).toEqual(['article'])
    expect(metaValue(head, 'og:url')).toEqual(['https://nabichan.me/en/261020'])
    expect(metaValue(head, 'og:image')).toEqual(['https://nabichan.me/og/en/261020.png'])
    expect(metaValue(head, 'og:image:width')).toEqual(['1200'])
    expect(metaValue(head, 'og:image:height')).toEqual(['630'])
    expect(metaValue(head, 'og:image:alt')).toEqual(['How I built this blog'])
    expect(metaValue(head, 'og:site_name')).toEqual(['eunsol'])
    expect(metaValue(head, 'og:locale:alternate')).toEqual(['ko_KR'])
    expect(metaValue(head, 'article:published_time')).toEqual(['2026-10-20T12:00:00+09:00'])
    expect(metaValue(head, 'article:modified_time')).toEqual(['2026-10-20T12:00:00+09:00'])
    expect(metaValue(head, 'twitter:card')).toEqual(['summary_large_image'])
    expect(metaValue(head, 'twitter:image')).toEqual(['https://nabichan.me/og/en/261020.png'])
  })

  it('글 페이지는 검색 제목을 제목 메타에, 글 제목을 이미지 alt 에, 키워드를 keywords·article:tag 에 단다', () => {
    const head = pageHead({ ...base, title: 'SEO 제목', imageAlt: '글 제목', keywords: ['a', 'b'] })
    expect(head.meta.filter((meta) => 'title' in meta)).toEqual([{ title: 'SEO 제목' }])
    expect(metaValue(head, 'og:title')).toEqual(['SEO 제목'])
    expect(metaValue(head, 'twitter:title')).toEqual(['SEO 제목'])
    expect(metaValue(head, 'og:image:alt')).toEqual(['글 제목'])
    expect(metaValue(head, 'keywords')).toEqual(['a, b'])
    expect(metaValue(head, 'article:tag')).toEqual(['a', 'b'])
  })

  it('imageAlt 가 없으면 이미지 alt 는 제목이고, keywords 가 없으면 keywords 메타도 article:tag 도 없다', () => {
    const head = pageHead(base)
    expect(metaValue(head, 'og:image:alt')).toEqual(['How I built this blog'])
    expect(metaValue(head, 'keywords')).toEqual([])
    expect(metaValue(head, 'article:tag')).toEqual([])
  })

  it('website 타입에는 article 메타가 없고, 설명이 없으면 description 메타도 없다', () => {
    const head = pageHead({ ...base, type: 'website', description: undefined, published: undefined, markdownPath: undefined })
    expect(head.meta.some((meta) => meta.property?.startsWith('article:'))).toBe(false)
    expect(metaValue(head, 'description')).toEqual([])
    expect(head.links.some((link) => link.type === 'text/markdown')).toBe(false)
  })

  it('긴 설명은 160자로 자른다', () => {
    const [description] = metaValue(pageHead({ ...base, description: 'a'.repeat(200) }), 'description')
    expect([...(description ?? '')]).toHaveLength(160)
  })

  it('JSON-LD 를 script 로 싣는다', () => {
    const { scripts } = pageHead(base)
    expect(scripts).toHaveLength(1)
    expect(scripts[0].type).toBe('application/ld+json')
    expect(JSON.parse(scripts[0].children)['@graph']).toHaveLength(2)
  })
})
