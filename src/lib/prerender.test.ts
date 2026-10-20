import { describe, expect, it } from 'vitest'
import { shouldPrerender } from './prerender'

describe('shouldPrerender', () => {
  it('페이지 경로는 프리렌더한다', () => {
    for (const path of ['/', '/en/posts', '/261020', '/administrator']) expect(shouldPrerender(path)).toBe(true)
  })

  it('쿼리·해시가 붙은 경로, API, Access 입구는 프리렌더하지 않는다', () => {
    for (const path of ['/posts?tag=a', '/261020#x', '/api/me', '/admin', '/admin/x']) expect(shouldPrerender(path)).toBe(false)
  })
})
