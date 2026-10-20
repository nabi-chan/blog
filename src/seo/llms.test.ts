import { describe, expect, it } from 'vitest'
import type { FeedItem } from '~/entities/post'
import { buildLlmsFull, buildLlmsTxt } from '~/seo/llms'

const item = (slug: string, locale: 'ko' | 'en', extra: Partial<FeedItem['post']> = {}): FeedItem => ({
  post: { slug, locale, title: `${slug} ${locale}`, description: `${slug} 요약`, date: '2026-10-20T12:00:00+09:00', tags: [], draft: false, ...extra },
  tags: [],
  html: '',
  markdown: `${slug} ${locale} 원문`,
})

describe('buildLlmsTxt', () => {
  it('사이트 설명·작성자·링크·글 목록(.md 링크)을 llms.txt 형식으로 쓴다', () => {
    const text = buildLlmsTxt({ locale: 'ko', description: 'eunsol 개인 블로그', items: [item('261020', 'ko')] })
    expect(text.startsWith('# eunsol\n\n> eunsol 개인 블로그\n')).toBe(true)
    expect(text).toContain('작성자: eunsol (Nabi)')
    expect(text).toContain('## 링크')
    expect(text).toContain('- [RSS](https://nabichan.me/rss.xml)')
    expect(text).toContain('- [Sitemap](https://nabichan.me/sitemap.xml)')
    expect(text).toContain('- [전체 원문](https://nabichan.me/llms-full.txt)')
    expect(text).toContain('## 글\n\n- [261020 ko](https://nabichan.me/261020.md): 261020 요약')
  })

  it('영어판은 /en 경로와 영어 머리말을 쓴다', () => {
    const text = buildLlmsTxt({ locale: 'en', description: "eunsol's personal blog", items: [item('261020', 'en')] })
    expect(text).toContain('Author: eunsol (Nabi)')
    expect(text).toContain('## Links')
    expect(text).toContain('- [RSS](https://nabichan.me/en/rss.xml)')
    expect(text).toContain('- [Full text](https://nabichan.me/llms-full.txt)')
    expect(text).toContain('- [261020 en](https://nabichan.me/en/261020.md): 261020 요약')
  })

  it('다른 언어의 llms.txt 로 가는 링크를 둔다', () => {
    expect(buildLlmsTxt({ locale: 'ko', description: 'd', items: [] })).toContain('- [English](https://nabichan.me/en/llms.txt)')
    expect(buildLlmsTxt({ locale: 'en', description: 'd', items: [] })).toContain('- [한국어](https://nabichan.me/llms.txt)')
  })

  it('글이 없으면 목록 자리에 (none) 을 쓴다', () => {
    expect(buildLlmsTxt({ locale: 'en', description: 'd', items: [] })).toContain('## Posts\n\n- (none)')
  })
})

describe('buildLlmsFull', () => {
  it('한국어 글 다음 영어 번역을 URL·날짜·언어 머리말과 원문으로 잇는다', () => {
    const text = buildLlmsFull({ ko: [item('261020', 'ko', { updated: '2026-10-21T09:00:00+09:00' })], en: [item('261020', 'en')] })
    expect(text.indexOf('# 261020 ko')).toBeLessThan(text.indexOf('# 261020 en'))
    expect(text).toContain('# 261020 ko\n\nURL: https://nabichan.me/261020\nDate: 2026-10-20T12:00:00+09:00\nUpdated: 2026-10-21T09:00:00+09:00\nLanguage: ko\n\n261020 ko 원문\n\n---')
    expect(text).toContain('URL: https://nabichan.me/en/261020\nDate: 2026-10-20T12:00:00+09:00\nLanguage: en')
  })
})
