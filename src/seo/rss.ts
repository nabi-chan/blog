import type { FeedItem } from '~/content/post-queries'
import type { Locale } from '~/i18n/runtime'
import { escapeXml } from './text'
import { pageUrl } from './url'

// 본문은 우리가 빌드한 HTML 이라 속성 문자열만 바꾼다. 사이트 경로(/…)와 #헤딩 링크만 절대 URL 로 만든다
export function absolutizeHtml(html: string, pageUrl: string): string {
  const origin = new URL(pageUrl).origin
  const absolute = (value: string) => (value.startsWith('/') && !value.startsWith('//') ? `${origin}${value}` : value)
  return html
    .replace(/\b(src|href)="([^"]*)"/g, (_, name: string, value: string) =>
      `${name}="${value.startsWith('#') ? `${pageUrl}${value}` : absolute(value)}"`,
    )
    .replace(/\bsrcset="([^"]*)"/g, (_, value: string) =>
      `srcset="${value
        .split(',')
        .map((entry) => {
          const [url, ...rest] = entry.trim().split(/\s+/)
          return [absolute(url), ...rest].join(' ')
        })
        .join(', ')}"`,
    )
}

const rfc822 = (iso: string) => new Date(iso).toUTCString()
// CDATA 안에서는 ]]> 만 문제다. 두 CDATA 로 나눠서 감싼다
const cdata = (text: string) => `<![CDATA[${text.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`

// 언어별 RSS 2.0. 본문 전문을 content:encoded 로 싣는다 (스펙 4.9)
export function buildRss(input: { locale: Locale; title: string; description: string; items: FeedItem[] }): string {
  const latest = input.items.map(({ post }) => post.updated ?? post.date).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1)
  const items = input.items.map(({ post, tags, html }) => {
    const url = pageUrl(`/${post.slug}`, input.locale)
    return [
      '    <item>',
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <pubDate>${rfc822(post.date)}</pubDate>`,
      `      <description>${escapeXml(post.description)}</description>`,
      `      <content:encoded>${cdata(absolutizeHtml(html, url))}</content:encoded>`,
      ...tags.map((tag) => `      <category>${escapeXml(tag.label)}</category>`),
      '    </item>',
    ].join('\n')
  })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    `    <title>${escapeXml(input.title)}</title>`,
    `    <link>${escapeXml(pageUrl('/', input.locale))}</link>`,
    `    <description>${escapeXml(input.description)}</description>`,
    `    <language>${input.locale}</language>`,
    `    <atom:link href="${escapeXml(pageUrl('/rss.xml', input.locale))}" rel="self" type="application/rss+xml"/>`,
    ...(latest === undefined ? [] : [`    <lastBuildDate>${rfc822(latest)}</lastBuildDate>`]),
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
