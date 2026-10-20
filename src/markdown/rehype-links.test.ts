import { describe, expect, it } from 'vitest'
import { rehypeLinks } from './rehype-links'
import { runPlugins } from './test-utils'

const enSlugs = new Set(['both'])
const run = (md: string, locale: 'ko' | 'en') => runPlugins(md, { rehype: [[rehypeLinks, { locale, enSlugs }]] })

describe('rehypeLinks', () => {
  it('영어 본문의 내부 글 링크를 현지화하고, 번역 없는 글엔 hreflang 을 단다', async () => {
    const { html } = await run('[a](/posts/both) [b](/posts/ko-only)', 'en')
    expect(html).toContain('href="/en/posts/both"')
    expect(html).toContain('href="/posts/ko-only" hreflang="ko"')
  })

  it('외부 링크만 새 탭으로 연다', async () => {
    const { html } = await run('[c](https://example.com) [d](#top)', 'en')
    expect(html).toContain('href="https://example.com" target="_blank" rel="noopener"')
    expect(html).toContain('<a href="#top">d</a>')
  })

  it('한국어 본문은 그대로다', async () => {
    const { html } = await run('[a](/posts/both)', 'ko')
    expect(html).toContain('<a href="/posts/both">a</a>')
  })
})
