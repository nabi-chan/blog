import { describe, expect, it } from 'vitest'
import type { FeedItem } from '~/content/post-queries'
import { absolutizeHtml, buildRss } from './rss'

const PAGE = 'https://nabichan.me/261020'

describe('absolutizeHtml', () => {
  it('src·href·srcset 의 사이트 경로에 주소를 붙인다', () => {
    const html =
      '<img src="/content-assets/a.png" srcset="/content-assets/a.720w.webp 720w, /content-assets/a.1440w.webp 1440w"><a href="/261021">다음</a>'
    expect(absolutizeHtml(html, PAGE)).toBe(
      '<img src="https://nabichan.me/content-assets/a.png" srcset="https://nabichan.me/content-assets/a.720w.webp 720w, https://nabichan.me/content-assets/a.1440w.webp 1440w"><a href="https://nabichan.me/261021">다음</a>',
    )
  })

  it('#헤딩 링크는 글 주소를 붙인다', () => {
    expect(absolutizeHtml('<a href="#intro">처음</a>', PAGE)).toBe('<a href="https://nabichan.me/261020#intro">처음</a>')
  })

  it('외부 URL 과 // 로 시작하는 주소는 그대로 둔다', () => {
    const html = '<a href="https://x.com">x</a><img src="//cdn.example/y.png">'
    expect(absolutizeHtml(html, PAGE)).toBe(html)
  })
})

const item = (slug: string, overrides: Partial<FeedItem['post']> = {}, html = '<p>본문</p>'): FeedItem => ({
  post: { slug, locale: 'ko', title: slug, description: `${slug} 요약`, date: '2026-10-20T12:00:00+09:00', tags: ['meta'], draft: false, ...overrides },
  tags: [{ key: 'meta', label: '블로그' }],
  html,
  markdown: '',
})

describe('buildRss', () => {
  it('RSS 2.0 채널과 자기 주소·언어를 단다', () => {
    const xml = buildRss({ locale: 'ko', title: 'eunsol', description: 'eunsol 개인 블로그', items: [item('261020')] })
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">')
    expect(xml).toContain('<link>https://nabichan.me/</link>')
    expect(xml).toContain('<atom:link href="https://nabichan.me/rss.xml" rel="self" type="application/rss+xml"/>')
    expect(xml).toContain('<language>ko</language>')
    expect(xml).toContain('<lastBuildDate>Tue, 20 Oct 2026 03:00:00 GMT</lastBuildDate>')
  })

  it('글마다 링크·guid·날짜·요약·본문 전문·태그를 넣는다', () => {
    const xml = buildRss({ locale: 'ko', title: 'eunsol', description: 'd', items: [item('261020', {}, '<p><img src="/content-assets/a.png"></p>')] })
    expect(xml).toContain('<link>https://nabichan.me/261020</link>')
    expect(xml).toContain('<guid isPermaLink="true">https://nabichan.me/261020</guid>')
    expect(xml).toContain('<pubDate>Tue, 20 Oct 2026 03:00:00 GMT</pubDate>')
    expect(xml).toContain('<description>261020 요약</description>')
    expect(xml).toContain('<content:encoded><![CDATA[<p><img src="https://nabichan.me/content-assets/a.png"></p>]]></content:encoded>')
    expect(xml).toContain('<category>블로그</category>')
  })

  it('en 피드는 /en 주소를 쓴다', () => {
    const xml = buildRss({ locale: 'en', title: 'eunsol', description: 'd', items: [item('261020', { locale: 'en' })] })
    expect(xml).toContain('<link>https://nabichan.me/en</link>')
    expect(xml).toContain('<link>https://nabichan.me/en/261020</link>')
    expect(xml).toContain('href="https://nabichan.me/en/rss.xml"')
  })

  it('제목의 특수 문자는 이스케이프하고 본문의 ]]> 는 CDATA 를 나눠 감싼다', () => {
    const xml = buildRss({ locale: 'ko', title: 'eunsol', description: 'd', items: [item('261020', { title: 'A & <B>' }, '<p>x]]>y</p>')] })
    expect(xml).toContain('<title>A &amp; &lt;B&gt;</title>')
    expect(xml).toContain('<![CDATA[<p>x]]]]><![CDATA[>y</p>]]>')
  })

  it('글이 없으면 lastBuildDate 를 두지 않는다 (가짜 날짜 금지)', () => {
    expect(buildRss({ locale: 'ko', title: 'eunsol', description: 'd', items: [] })).not.toContain('lastBuildDate')
  })

  it('lastBuildDate 는 글 순서와 상관없이 가장 늦은 수정일이다', () => {
    const xml = buildRss({
      locale: 'ko',
      title: 'eunsol',
      description: 'd',
      items: [item('261021', { date: '2026-10-21T12:00:00+09:00' }), item('261020', { updated: '2026-10-23T09:00:00+09:00' })],
    })
    expect(xml).toContain('<lastBuildDate>Fri, 23 Oct 2026 00:00:00 GMT</lastBuildDate>')
  })

  it('lastBuildDate 는 가장 최근 글의 수정일이다', () => {
    const xml = buildRss({ locale: 'ko', title: 'eunsol', description: 'd', items: [item('261020', { updated: '2026-10-22T09:00:00+09:00' })] })
    expect(xml).toContain('<lastBuildDate>Thu, 22 Oct 2026 00:00:00 GMT</lastBuildDate>')
  })
})
