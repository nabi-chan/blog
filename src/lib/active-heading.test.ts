import { describe, expect, it } from 'vitest'
import { pickActiveHeading } from './active-heading'

const headings = [
  { id: 'a', top: -400 },
  { id: 'b', top: 120 },
  { id: 'c', top: 900 },
]

describe('pickActiveHeading', () => {
  it('기준선 위로 올라간 마지막 헤딩을 고른다', () => {
    expect(pickActiveHeading(headings, { threshold: 200, atBottom: false })).toBe('b')
    expect(pickActiveHeading(headings, { threshold: 100, atBottom: false })).toBe('a')
  })

  it('아직 첫 헤딩에 닿지 않았으면 없다', () => {
    expect(pickActiveHeading([{ id: 'a', top: 500 }], { threshold: 200, atBottom: false })).toBeNull()
  })

  it('페이지 끝까지 내렸으면 마지막 헤딩이다 (짧은 마지막 섹션)', () => {
    expect(pickActiveHeading(headings, { threshold: 200, atBottom: true })).toBe('c')
  })

  it('헤딩이 없으면 없다', () => {
    expect(pickActiveHeading([], { threshold: 200, atBottom: true })).toBeNull()
  })
})
