import { describe, expect, it } from 'vitest'
import { readTagParam, tagFilterCss } from './tag-filter'

describe('tagFilterCss', () => {
  it('태그마다 숨김·빈 연도·활성 칩 규칙을 만든다', () => {
    expect(tagFilterCss(['meta'])).toBe(
      'html[data-tag="meta"] [data-post]:not([data-tags~="meta"]){display:none}' +
        'html[data-tag="meta"] [data-year]:not(:has([data-tags~="meta"])){display:none}' +
        'html[data-tag="meta"] [data-chip="meta"]{font-weight:700;text-decoration:underline}',
    )
  })

  it('태그가 없으면 빈 문자열이다', () => {
    expect(tagFilterCss([])).toBe('')
  })

  it('형식에 안 맞는 키는 건너뛴다 (CSS 주입 방지)', () => {
    expect(tagFilterCss(['a"b'])).toBe('')
  })
})

describe('readTagParam', () => {
  it('?tag 값을 읽는다', () => {
    expect(readTagParam('?tag=meta')).toBe('meta')
  })

  it('형식에 안 맞거나 없으면 undefined 다', () => {
    expect(readTagParam('?tag=META')).toBeUndefined()
    expect(readTagParam('')).toBeUndefined()
  })
})
