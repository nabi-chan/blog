import { describe, expect, it } from 'vitest'
import { formatCompactDate, formatDate, formatDateTime, kstYear, parseKstDate } from './date'

describe('parseKstDate', () => {
  it('날짜만 있으면 KST 자정으로 본다', () => {
    expect(parseKstDate('2026-05-06')).toBe('2026-05-06T00:00:00+09:00')
  })

  it('시분, 시분초 형식을 KST 로 해석한다', () => {
    expect(parseKstDate('2026-05-06 20:55')).toBe('2026-05-06T20:55:00+09:00')
    expect(parseKstDate('2026-05-06 20:55:00')).toBe('2026-05-06T20:55:00+09:00')
  })

  it.each(['2026-13-01', '2026-02-30', '2026-05-06T20:55', '06/05/2026', '2026-05-06 24:00'])(
    '형식이나 값이 틀리면 던진다: %s',
    (bad) => {
      expect(() => parseKstDate(bad)).toThrow()
    },
  )
})

describe('formatDate', () => {
  it('UTC 로는 전날이어도 KST 날짜로 표시한다', () => {
    expect(formatDate('2026-01-01T00:30:00+09:00', 'ko')).toBe('2026년 1월 1일')
    expect(formatDate('2026-01-01T00:30:00+09:00', 'en')).toBe('January 1, 2026')
  })
})

describe('kstYear', () => {
  it('KST 기준 연도를 돌려준다', () => {
    expect(kstYear('2026-01-01T00:30:00+09:00')).toBe(2026)
  })
})

describe('formatCompactDate', () => {
  it('KST 날짜를 YY.MM.DD 로 줄인다', () => {
    expect(formatCompactDate('2026-01-01T00:30:00+09:00')).toBe('26.01.01')
  })
})

describe('formatDateTime', () => {
  it('댓글 시각을 KST 날짜와 시각으로 보여 준다', () => {
    expect(formatDateTime('2026-10-20T05:07:00.000Z', 'ko')).toBe('2026. 10. 20. 오후 2:07')
    expect(formatDateTime('2026-10-20T05:07:00.000Z', 'en')).toBe('Oct 20, 2026, 2:07 PM')
  })
})
