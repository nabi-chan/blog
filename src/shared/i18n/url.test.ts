import { describe, expect, it } from 'vitest'
import { stripTrailingSlash } from './url'

describe('stripTrailingSlash', () => {
  it('경로 끝 슬래시를 지운다 (루트는 그대로)', () => {
    expect(stripTrailingSlash('/en/')).toBe('/en')
    expect(stripTrailingSlash('/en/posts/')).toBe('/en/posts')
    expect(stripTrailingSlash('/')).toBe('/')
    expect(stripTrailingSlash('/posts')).toBe('/posts')
  })

  it('쿼리와 해시는 보존한다', () => {
    expect(stripTrailingSlash('/en/?category=a#x')).toBe('/en?category=a#x')
  })
})
