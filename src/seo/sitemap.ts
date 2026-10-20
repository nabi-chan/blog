import type { PostIndex } from '~/content/post-index'
import type { Locale } from '~/i18n/runtime'
import { escapeXml } from './text'
import { pageUrl } from './url'

// path 는 언어 접두사 없는 경로, locales 는 그 페이지가 실제로 있는 언어
export type SitemapEntry = { path: string; lastmod?: Partial<Record<Locale, string>>; locales: Locale[] }

// 언어마다 <url> 을 두고, 번역 쌍이면 서로를 xhtml:link 로 잇는다 (x-default 는 ko). priority·changefreq 는 쓰지 않는다 (스펙 4.9)
export function buildSitemap(entries: SitemapEntry[]): string {
  const urls = entries.flatMap(({ path, lastmod = {}, locales }) => {
    const alternates =
      locales.length > 1
        ? [
            ...locales.map((locale) => `    <xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(pageUrl(path, locale))}"/>`),
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(pageUrl(path, 'ko'))}"/>`,
          ]
        : []
    return locales.map((locale) =>
      [
        '  <url>',
        `    <loc>${escapeXml(pageUrl(path, locale))}</loc>`,
        ...(lastmod[locale] === undefined ? [] : [`    <lastmod>${escapeXml(lastmod[locale])}</lastmod>`]),
        ...alternates,
        '  </url>',
      ].join('\n'),
    )
  })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

const modifiedAt = (post: { date: string; updated?: string }) => post.updated ?? post.date
const latestOf = (posts: Array<{ date: string; updated?: string; draft: boolean }>) =>
  posts
    .filter((post) => !post.draft)
    .map(modifiedAt)
    .sort()
    .at(-1)

// Lobby·Posts 와 공개 글(draft 제외). 글의 언어는 실제 번역 쌍만, lastmod 는 updated ?? date (가짜 날짜를 넣지 않는다).
// 목록 페이지의 lastmod 는 언어마다 그 언어 목록의 최근 수정일이다
export function sitemapEntries(index: PostIndex): SitemapEntry[] {
  const listLastmod: Partial<Record<Locale, string>> = {}
  for (const locale of ['ko', 'en'] as const) {
    const latest = latestOf(index.list(locale))
    if (latest !== undefined) listLastmod[locale] = latest
  }
  const listPage = (path: string): SitemapEntry => ({ path, lastmod: listLastmod, locales: ['ko', 'en'] })
  const posts = index.list('ko').filter((post) => !post.draft)
  return [
    listPage('/'),
    listPage('/posts'),
    ...posts.map((post) => {
      const locales = index.locales(post.slug)
      return { path: `/${post.slug}`, lastmod: Object.fromEntries(locales.map((locale) => [locale, modifiedAt(post)])), locales }
    }),
  ]
}
