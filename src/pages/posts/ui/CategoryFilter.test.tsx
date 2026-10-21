import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CategoryChips } from './CategoryFilter'

describe('CategoryChips', () => {
  it('URL 쿼리와 상관없이 같은 마크업을 낸다 (활성 표시는 CSS 와 브라우저 effect 가 맡는다)', () => {
    const html = renderToStaticMarkup(<CategoryChips categories={[{ key: 'meta', label: '블로그' }]} allLabel="모두" label="카테고리로 거르기" />)
    expect(html).toContain('href="/posts?category=meta"')
    expect(html).toContain('data-chip="meta"')
    expect(html).toContain('href="/posts"')
    expect(html).toContain('aria-label="카테고리로 거르기"')
    expect(html).not.toContain('aria-current')
    expect(html).not.toContain('data-status')
  })
})
