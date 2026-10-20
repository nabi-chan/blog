import { describe, expect, it } from 'vitest'
import { isMalformedPath } from '~/lib/url-guard'

describe('isMalformedPath', () => {
  it('디코딩할 수 없는 퍼센트 인코딩은 잘못된 경로다', () => {
    expect(isMalformedPath('/posts/%E0')).toBe(true)
    expect(isMalformedPath('/posts/%')).toBe(true)
  })

  it('정상 인코딩과 일반 경로는 통과한다', () => {
    expect(isMalformedPath('/posts/%ED%95%9C')).toBe(false)
    expect(isMalformedPath('/posts/hello')).toBe(false)
  })
})
