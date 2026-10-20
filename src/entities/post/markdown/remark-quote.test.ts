import { describe, expect, it } from 'vitest'
import { remarkQuote } from './remark-quote'
import { runPlugins } from './test-utils'

const run = (md: string, locale: 'ko' | 'en') => runPlugins(md, { remark: [[remarkQuote, { locale }]] })
const quote = '::::quote\n:::translation\n번역문\n:::\n:::original\nOriginal text\n:::\n::::'

describe('remarkQuote', () => {
  it('한국어 글은 번역과 원문을 같이 보여준다', async () => {
    const { html } = await run(quote, 'ko')
    expect(html).toContain('<blockquote class="bilingual-quote"><div class="quote-translation" lang="ko">')
    expect(html).toContain('<div class="quote-original" lang="en"><p>Original text</p></div>')
  })

  it('원문과 같은 언어의 글은 원문만 보여준다', async () => {
    const { html } = await run(quote, 'en')
    expect(html).not.toContain('번역문')
    expect(html).toContain('Original text')
  })

  it('원문 언어를 지정할 수 있다', async () => {
    const { html } = await run('::::quote\n:::translation\n번역\n:::\n:::original{lang="ja"}\n原文\n:::\n::::', 'en')
    expect(html).toContain('<div class="quote-translation" lang="en">')
    expect(html).toContain('<div class="quote-original" lang="ja">')
  })

  it('번역과 원문이 하나씩 있지 않거나 비어 있으면 빌드 오류다', async () => {
    await expect(run('::::quote\n:::original\nx\n:::\n::::', 'ko')).rejects.toThrow(/quote/)
    await expect(run('::::quote\n:::translation\n:::\n:::original\nx\n:::\n::::', 'ko')).rejects.toThrow(/quote/)
  })
})
