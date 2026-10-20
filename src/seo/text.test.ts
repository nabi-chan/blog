import { describe, expect, it } from 'vitest'
import { escapeXml, truncateMeta } from '~/seo/text'

describe('truncateMeta', () => {
  it('상한 안이면 그대로 둔다', () => {
    expect(truncateMeta('가'.repeat(160), 160)).toBe('가'.repeat(160))
  })

  it('넘으면 코드 포인트 기준으로 자르고 … 를 붙인다', () => {
    const result = truncateMeta('가'.repeat(161), 160)
    expect([...result]).toHaveLength(160)
    expect(result.endsWith('…')).toBe(true)
    expect([...truncateMeta('😀'.repeat(5), 3)]).toEqual(['😀', '😀', '…'])
  })

  it('앞뒤 공백을 정리하고, 자른 끝의 공백도 지운다', () => {
    expect(truncateMeta('  안녕  ', 10)).toBe('안녕')
    expect(truncateMeta('ab cdef', 4)).toBe('ab…')
  })
})

describe('escapeXml', () => {
  it('XML 특수 문자를 엔티티로 바꾼다', () => {
    expect(escapeXml(`a & <b> "c" 'd'`)).toBe('a &amp; &lt;b&gt; &quot;c&quot; &apos;d&apos;')
  })
})
