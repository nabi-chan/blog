import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TagChips } from './TagFilter'

describe('TagChips', () => {
  it('URL 쿼리와 상관없이 같은 마크업을 낸다 (활성 표시는 CSS 와 브라우저 effect 가 맡는다)', () => {
    const html = renderToStaticMarkup(<TagChips tags={[{ key: 'meta', label: '블로그' }]} allLabel="전체" label="태그로 거르기" />)
    expect(html).toContain('href="/posts?tag=meta"')
    expect(html).toContain('data-chip="meta"')
    expect(html).toContain('href="/posts"')
    expect(html).toContain('aria-label="태그로 거르기"')
    expect(html).not.toContain('aria-current')
    expect(html).not.toContain('data-status')
  })
})
