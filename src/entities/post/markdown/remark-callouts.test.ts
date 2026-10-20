import { describe, expect, it } from 'vitest'
import { remarkCallouts } from './remark-callouts'
import { runPlugins } from './test-utils'

const run = (md: string, locale: 'ko' | 'en') => runPlugins(md, { remark: [[remarkCallouts, { locale }]] })

describe('remarkCallouts', () => {
  it('GitHub 알림 문법을 aside 와 언어별 제목으로 바꾼다', async () => {
    const { html } = await run('> [!NOTE]\n> x', 'ko')
    expect(html).toMatch(/<aside class="callout" data-callout="note" role="note">\s*<p class="callout-title">참고<\/p>/)
    expect(html).toContain('<p>x</p>')
    expect(html).not.toContain('[!NOTE]')
  })

  it('종류 표지는 대소문자를 가리지 않는다', async () => {
    const { html } = await run('> [!warning]\n> x', 'en')
    expect(html).toContain('data-callout="warning"')
    expect(html).toContain('<p class="callout-title">Warning</p>')
  })

  it('표지 줄만 있는 문단은 지운다', async () => {
    const { html } = await run('> [!TIP]\n>\n> 둘째 문단', 'ko')
    expect(html).toContain('<p class="callout-title">팁</p>')
    expect(html).toContain('<p>둘째 문단</p>')
    expect(html).not.toMatch(/<p>\s*<\/p>/)
  })

  it('모르는 종류와 일반 인용은 blockquote 로 남는다', async () => {
    expect((await run('> [!FOO]\n> x', 'ko')).html).toContain('<blockquote>')
    expect((await run('> [!FOO]\n> x', 'ko')).html).toContain('[!FOO]')
    expect((await run('> 그냥 인용', 'ko')).html).toContain('<blockquote>')
  })
})
