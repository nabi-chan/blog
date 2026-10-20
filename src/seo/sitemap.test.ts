import { describe, expect, it } from 'vitest'
import { type PostMeta, createPostIndex } from '~/entities/post'
import { buildSitemap, sitemapEntries } from '~/seo/sitemap'

const count = (text: string, needle: string) => text.split(needle).length - 1

describe('buildSitemap', () => {
  it('XML 선언과 네임스페이스로 시작한다', () => {
    const xml = buildSitemap([])
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">')
  })

  it('번역 쌍은 언어마다 <url> 을 두고 ko·en·x-default 대체 링크를 단다', () => {
    const xml = buildSitemap([{ path: '/261020', lastmod: { ko: '2026-10-20T12:00:00+09:00', en: '2026-10-20T12:00:00+09:00' }, locales: ['ko', 'en'] }])
    expect(count(xml, '<url>')).toBe(2)
    expect(xml).toContain('<loc>https://nabichan.me/261020</loc>')
    expect(xml).toContain('<loc>https://nabichan.me/en/261020</loc>')
    expect(count(xml, '<xhtml:link rel="alternate" hreflang="ko" href="https://nabichan.me/261020"/>')).toBe(2)
    expect(count(xml, '<xhtml:link rel="alternate" hreflang="x-default" href="https://nabichan.me/261020"/>')).toBe(2)
    expect(count(xml, '<lastmod>2026-10-20T12:00:00+09:00</lastmod>')).toBe(2)
  })

  it('번역이 없는 글은 <url> 하나이고 대체 링크가 없다', () => {
    const xml = buildSitemap([{ path: '/261021', lastmod: { ko: '2026-10-21T09:00:00+09:00' }, locales: ['ko'] }])
    expect(count(xml, '<url>')).toBe(1)
    expect(xml).not.toContain('xhtml:link rel')
  })

  it('lastmod 가 없으면 태그를 쓰지 않고, priority·changefreq 는 쓰지 않는다', () => {
    const xml = buildSitemap([{ path: '/posts', locales: ['ko'] }])
    expect(xml).not.toContain('<lastmod>')
    expect(xml).not.toContain('priority')
    expect(xml).not.toContain('changefreq')
  })

  it('URL 의 XML 특수 문자는 이스케이프한다', () => {
    expect(buildSitemap([{ path: '/a&b', locales: ['ko'] }])).toContain('<loc>https://nabichan.me/a&amp;b</loc>')
  })
})

describe('sitemapEntries', () => {
  const meta = (slug: string, locale: 'ko' | 'en', date: string, extra: Partial<PostMeta> = {}): PostMeta => ({
    slug,
    locale,
    title: slug,
    description: slug,
    date,
    tags: [],
    draft: false,
    ...extra,
  })
  const index = createPostIndex(
    [
      meta('261020', 'ko', '2026-10-20T12:00:00+09:00', { updated: '2026-10-22T09:00:00+09:00' }),
      meta('261021', 'ko', '2026-10-21T12:00:00+09:00'),
      meta('261023', 'ko', '2026-10-23T12:00:00+09:00', { draft: true }),
    ],
    [meta('261020', 'en', '2026-10-20T12:00:00+09:00', { updated: '2026-10-22T09:00:00+09:00' })],
  )

  it('Lobby·Posts 와 공개 글을 넣고, 목록의 lastmod 는 가장 최근 수정일이다', () => {
    const both = { ko: '2026-10-22T09:00:00+09:00', en: '2026-10-22T09:00:00+09:00' }
    expect(sitemapEntries(index)).toEqual([
      { path: '/', lastmod: both, locales: ['ko', 'en'] },
      { path: '/posts', lastmod: both, locales: ['ko', 'en'] },
      { path: '/261021', lastmod: { ko: '2026-10-21T12:00:00+09:00' }, locales: ['ko'] },
      { path: '/261020', lastmod: both, locales: ['ko', 'en'] },
    ])
  })

  it('글이 없으면 목록 페이지에 lastmod 를 두지 않는다', () => {
    expect(sitemapEntries(createPostIndex([], []))).toEqual([
      { path: '/', lastmod: {}, locales: ['ko', 'en'] },
      { path: '/posts', lastmod: {}, locales: ['ko', 'en'] },
    ])
  })

  it('목록 페이지의 lastmod 는 언어마다 그 언어 글로 정한다 (ko 전용 글이 en 날짜를 올리지 않는다)', () => {
    const koOnlyNewer = createPostIndex(
      [meta('261020', 'ko', '2026-10-20T12:00:00+09:00'), meta('261025', 'ko', '2026-10-25T12:00:00+09:00')],
      [meta('261020', 'en', '2026-10-20T12:00:00+09:00')],
    )
    expect(sitemapEntries(koOnlyNewer)[0]).toEqual({
      path: '/',
      lastmod: { ko: '2026-10-25T12:00:00+09:00', en: '2026-10-20T12:00:00+09:00' },
      locales: ['ko', 'en'],
    })
  })
})
